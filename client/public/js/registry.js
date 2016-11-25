angular.module("blockswap")

.constant("REGISTRY_GITHUB_LOCATION", "https://github.com/habond/blockswap/chaincode/DealRegistry")

.factory("RegistryService", function(ChaincodeService, REGISTRY_GITHUB_LOCATION){

	var fns = {

		"registerDeal": function(dealDeploymentId, issuer) {
			return ChaincodeService.invoke(this.deploymentId, "registerDeal", [dealDeploymentId, issuer]);
		},

		"getDeals": function() {
			return ChaincodeService.query(this.deploymentId, "getDeals", []);
		}

	};

	return {

		"deployRegistry": function() {
			var nonce = Math.random().toString();
			return ChaincodeService.deploy(REGISTRY_GITHUB_LOCATION, "init", [nonce])
				.then(function(response) {
					var deploymentId = response.data.result.message;
					return angular.extend({"deploymentId": deploymentId}, fns);
				});
		},

		"fromDeploymentId": function(deploymentId) {
			return angular.extend({"deploymentId": deploymentId}, fns);			
		}
	};


})

.controller("RegistryController", function($scope, $log, $q, RegistryService, BookService, KeyStoreService) {

	var registry = null;

	KeyStoreService.get("DealRegistry")
		.then(function(response){
			if(response.data) {
				var deploymentId = response.data;
				registry = RegistryService.fromDeploymentId(deploymentId);
				$scope.getDeals();
			}
		});

	$scope.$on("user changed", function(e, data){
		if(registry)
			$scope.getDeals();
	});

	$scope.$on('blockchain event', function(e, d){
		handleEvent(d.id, d.event, d.data);
	});

	function handleEvent(id, event, data) {
		if(event == "New Deal Registered") {
			$scope.getDeals();
		}
	}

	$scope.deploy = function() {
		$log.log("Deploying Deal Registry");
		RegistryService.deployRegistry()
			.then(function(response){
				KeyStoreService.set("DealRegistry", response.deploymentId);
				registry = RegistryService.fromDeploymentId(response.deploymentId);
			});
	};

	$scope.getDeals = function() {
		registry.getDeals()
			.then(function(response){
				var deals = angular.fromJson(response.data.result.message);
				var dealDeploymentIds = deals.map(function(deal){ return deal.deploymentId; });
				var books = dealDeploymentIds.map(function(id){ return BookService.fromDeploymentId(id); });
				var promises = books.map(function(book){ return book.getOrder($scope.username); });
				$q.all(promises)
					.then(function(results){
						console.log(results);
						angular.forEach(results, function(response, i){
							var order = angular.fromJson(response.data.result.message);
							if(order.ioi > 0) {
								deals[i].myOrder = order.ioi;
							}
						});
						$scope.deals = deals;
					});
			});
	};

	$scope.createDeal = function(){
		$log.log("Creating Deal");
		BookService.createDeal($scope.username, $scope.banks, "draft", 0.0)
			.then(function(book){
				registry.registerDeal(book.deploymentId, $scope.issuer);
			});
	};

	$scope.updateOrder = function(deal) {
		if(!deal.myOrder)
			return;
		$log.log("Updated Order for " + deal.issuer + " with value " + deal.myOrder);
		var book = BookService.fromDeploymentId(deal.deploymentId);
		book.addOrder($scope.username, deal.myOrder);
	}

});