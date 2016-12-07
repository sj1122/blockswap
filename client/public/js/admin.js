angular.module("blockswap")

.controller("AdminController", function($scope, $log, RegistryService, DocService, KeyStoreService){

	$scope.pendingDealRegDeploymentId = null;
	$scope.pendingDocRegDeploymentId = null;

	$scope.dealRegDeployed = false;
	$scope.docRegDeployed = false;

	KeyStoreService.get("DealRegistry")
		.then(function(response){
			if(response.data) {
				$scope.dealRegDeployed = true;
			}
		});

	KeyStoreService.get("DocRegistry")
		.then(function(response){
			if(response.data) {
				$scope.docRegDeployed = true;
			}
		});

	$scope.$on('blockchain event', function(e, d){
		if(d.event == "Contract Deployed") {
			if($scope.pendingDealRegDeploymentId == d.id) {
				$scope.dealRegDeployed = true;
				$scope.pendingDealRegDeploymentId = null;
			} else if($scope.pendingDocRegDeploymentId == d.id) {
				$scope.docRegDeployed = true;
				$scope.pendingDocRegDeploymentId = null;
			}
		}
	});

	$scope.deployDealRegistry = function(){
		$log.log("Deploying Deal Registry");
		$scope.pendingDealRegDeploymentId = "pending";
		RegistryService.deployRegistry()
			.then(function(response){
				KeyStoreService.set("DealRegistry", response.deploymentId);
				$scope.pendingDealRegDeploymentId = response.deploymentId;
			});
	};

	$scope.deployDocRegistry = function() {
		$log.log("Deploying Doc Registry");
		$scope.pendingDocRegDeploymentId = "pending";
		DocService.deployDocs()
			.then(function(response){
				KeyStoreService.set("DocRegistry", response.deploymentId);
				$scope.pendingDocRegDeploymentId = response.deploymentId;
			});
	};

});