angular.module("blockswap")

.controller("AdminController", function($scope, $log, RegistryService, DocService, KeyStoreService){

	$scope.deployDealRegistry = function(){
		$log.log("Deploying Deal Registry");
		RegistryService.deployRegistry()
			.then(function(response){
				KeyStoreService.set("DealRegistry", response.deploymentId);
			});
	};

	$scope.deployDocRegistry = function() {
		$log.log("Deploying Doc Registry");
		DocService.deployDocs()
			.then(function(response){
				KeyStoreService.set("DocRegistry", response.deploymentId);
			});
	};

});