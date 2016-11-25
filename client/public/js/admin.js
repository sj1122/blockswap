angular.module("blockswap")

.controller("AdminController", function($scope, $log, RegistryService, KeyStoreService){

	$scope.deployDealRegistry = function(){
		$log.log("Deploying Deal Registry");
		RegistryService.deployRegistry()
			.then(function(response){
				KeyStoreService.set("DealRegistry", response.deploymentId);
				registry = RegistryService.fromDeploymentId(response.deploymentId);
			});
	};

});