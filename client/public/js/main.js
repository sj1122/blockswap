angular.module("blockswap", ["ngRoute"])

.constant("HYPERLEDGER_ROLE", "investor")

.config(function($routeProvider, $logProvider) {

	$logProvider.debugEnabled(false);

	$routeProvider

		.when("/registry", {
			templateUrl: "templates/registry.html",
			controller: "RegistryController"			
		})

		.when("/book/:deploymentId", {
			templateUrl: "templates/book.html",
			controller: "BookController"
		})

		.when("/admin", {
			templateUrl: "templates/admin.html",
			controller: "AdminController"
		})

		.otherwise({
			redirectTo: '/registry'
		});

})

.run(function(ChaincodeEventMonitor){

	ChaincodeEventMonitor.start();

});