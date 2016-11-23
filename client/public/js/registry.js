angular.module("blockswap")

.constant("REGISTRY_GITHUB_LOCATION", "https://github.com/habond/blockswap/chaincode/DealRegistry")

.factory("RegistryService", function($rootScope, $http, ChaincodeService, REGISTRY_GITHUB_LOCATION){

	return {

		"deployRegistry": function() {
			var nonce = Math.random().toString();
			return ChaincodeService.deploy(REGISTRY_GITHUB_LOCATION, "init", [nonce])
				.then(function(response) {
					$rootScope.registryDeploymentId = response.data.result.message;
					return response;
				});
		},

		"registerDeal": function(dealDeploymentId, issuer) {
			return ChaincodeService.invoke($rootScope.registryDeploymentId, "registerDeal", [dealDeploymentId, issuer]);
		},

		"getDeals": function() {
			return ChaincodeService.query($rootScope.registryDeploymentId, "getDeals", []);
		}

	};

})

.controller("RegistryController", function($rootScope, $scope, $log, RegistryService, BookService, KeyStoreService) {

	init();
	function init() {
		KeyStoreService.get("DealRegistry")
			.then(function(response){
				if(response.data) {
					$rootScope.registryDeploymentId = response.data;
				}
			});
	}

	$scope.deploy = function() {
		$log.log("Deploying Deal Registry");
		RegistryService.deployRegistry()
			.then(function(response){
				KeyStoreService.set("DealRegistry", response.data.result.message);
			});
	};
	
	$scope.getDeals = function() {
		RegistryService.getDeals()
			.then(function(response){
				$scope.deals = angular.fromJson(response.data.result.message);
			});
	};

	$scope.createDeal = function(){
		$log.log("Creating Deal");
		BookService.createDeal()
			.then(function(response){
				var deploymentId = response.data.result.message;
				RegistryService.registerDeal(deploymentId, $scope.issuer);
			});
	};

});