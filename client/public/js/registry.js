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

.controller("RegistryController", function($window, $scope, $log, $q, RegistryService, BookService, DocService, KeyStoreService) {

	$scope.deployingDeal = null;
	$scope.deployingOrders = {};

	var registry = null;
	var docRegistry = null;

	KeyStoreService.get("DealRegistry")
		.then(function(response){
			if(response.data) {
				var deploymentId = response.data;
				registry = RegistryService.fromDeploymentId(deploymentId);
				$scope.getDeals();
			}
		});

	KeyStoreService.get("DocRegistry")
		.then(function(response){
			var deploymentId = response.data;
			docRegistry = DocService.fromDeploymentId(deploymentId);
			docRegistry.getDocsFor($scope.username)
				.then(function(response){
					$scope.myDocs = angular.fromJson(response.data.result.message);
				});
		});

	$scope.$on("user changed", function(e, data){
		if(registry) {
			$scope.getDeals();
		}
		if(docRegistry) {
			docRegistry.getDocsFor($scope.username)
				.then(function(response){
					$scope.myDocs = angular.fromJson(response.data.result.message);
				});
		}
	});

	$scope.$on('blockchain event', function(e, d){
		if(d.event == "New Deal Registered") {
			if($scope.deployingDeal != null) {
				var deploymentId = angular.fromJson(d.data).deploymentId;
				if($scope.deployingDeal == deploymentId)
					$scope.deployingDeal = null;
			}
			$scope.getDeals();
		} else if(d.event == "Order Allocated") {
			$scope.getDeals();
		} else if(d.event == "Order Added") {
			angular.forEach($scope.deployingOrders, function(val, key){
				if(val == d.id) {
					$scope.deployingOrders[key] = null;
				}
			});
		}
	});

	$scope.deploy = function() {
		$log.log("Deploying Deal Registry");
		RegistryService.deployRegistry()
			.then(function(response){
				KeyStoreService.set("DealRegistry", response.deploymentId);
				registry = RegistryService.fromDeploymentId(response.deploymentId);
			});
	}

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
								deals[i].myOrder = order;
							}
							if(order.alloc == -1) {
								order.alloc = undefined;
							}
						});
						$scope.deals = deals;
					});
			});
	};

	$scope.createDeal = function(){
		if(!$scope.banks || $scope.banks.length == 0) {
			alert("You must select at least 1 syndicate bank");
			return;
		}
		if(!$scope.reqDocs) {
			$scope.reqDocs = [];
		}
		$log.log("Creating Deal");
		$scope.deployingDeal = "pendingId";
		BookService.createDeal($scope.username, $scope.banks, "draft", docRegistry.deploymentId, $scope.reqDocs)
			.then(function(book){
				registry.registerDeal(book.deploymentId, $scope.issuer);
				$scope.deployingDeal = book.deploymentId;
			});
	};

	$scope.updateOrder = function(deal) {
		if(!deal.myOrder)
			return;
		$scope.deployingOrders[deal.issuer] = "pending";
		$log.log("Updated Order for " + deal.issuer + " with value " + deal.myOrder.ioi);
		var book = BookService.fromDeploymentId(deal.deploymentId);
		book.addOrder($scope.username, deal.myOrder.ioi)
			.then(function(response) {
				var deploymentId = response.data.result.message;
				$scope.deployingOrders[deal.issuer] = deploymentId;
			});
	};

	$scope.confirmOrder = function(deal) {
		if(!deal.myOrder)
			return;
		$log.log("Confirming Order for " + deal.issuer);
		var book = BookService.fromDeploymentId(deal.deploymentId);
		if($window.confirm("Are you sure you want to confirm your allocation of " + deal.myOrder.alloc)) {
			book.confirmOrder($scope.username);
		} else {
			deal.myOrder.confirmed = false;
		}
	};

	$scope.missingDoc = function(deal) {
		var requiredDocs = deal.requiredDocs;
		var myDocs = $scope.myDocs;
		for(var i=0; i<requiredDocs.length; i++) {
			if(myDocs.indexOf(requiredDocs[i]) == -1) {
				return true;
			}
		}
		return false;
	}

});