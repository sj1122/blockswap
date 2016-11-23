angular.module("blockswap", ["ngRoute"])

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

		.otherwise({
			redirectTo: '/registry'
		});

})

.run(function(ChaincodeEventMonitor){

	ChaincodeEventMonitor.start();

});