angular.module("blockswap")

.constant("BOOK_GITHUB_LOCATION", "https://github.com/habond/blockswap/chaincode/Book")

.factory("BookService", function(ChaincodeService, BOOK_GITHUB_LOCATION){

	var fns = {

		"updateDealStatus": function(newStatus) {
			return ChaincodeService.invoke(this.deploymentId, "updateDealStatus", [newStatus]);
		},

		"getOrderbook": function() {
			return ChaincodeService.query(this.deploymentId, "getOrderbook", []);
		},

		"addOrder": function(investor, amount) {
			return ChaincodeService.invoke(this.deploymentId, "addOrder", [investor, amount.toString()])
		},

		"getOrder": function(investor) {
			return ChaincodeService.query(this.deploymentId, "getOrder", [investor]);
		},

		"allocateOrder": function(investor, allocation) {
			return ChaincodeService.invoke(this.deploymentId, "allocateOrder", [investor, allocation.toString()]);
		},

		"getDealConfig": function() {
			return ChaincodeService.query(this.deploymentId, "getDealConfig", []);
		},

		"confirmOrder": function(investor) {
			return ChaincodeService.invoke(this.deploymentId, "confirmOrder", [investor])
		}

	};

	return {

		"createDeal": function(issuer, banks, bookStatus, docRegAddress, requireQib) {
			var nonce = Math.random().toString();
			var config = angular.toJson({
				"issuer": issuer,
				"banks": banks,
				"bookStatus": bookStatus,
				"docRegAddress": docRegAddress,
				"requireQib": requireQib
			});
			return ChaincodeService.deploy(BOOK_GITHUB_LOCATION, "init", [config, nonce])
				.then(function(response){
					var deploymentId = response.data.result.message
					return angular.extend({ 'deploymentId': deploymentId }, fns);
				});
		},

		"fromDeploymentId": function(deploymentId) {
			return angular.extend({'deploymentId': deploymentId}, fns);
		}

	};

})

.controller("BookController", function($log, $scope, $location, $routeParams, BookService){

	var book = null;

	$scope.$on('blockchain event', function(e, d){
		if(d.event == "Book Status Change") {
			$scope.getDealConfig();
		} else if(d.event == "Order Added") {
			$scope.getOrderbook();
		} else if(d.event == "Order Confirmed") {
			$scope.getOrderbook();
		}
	});

	$scope.$on("user changed", function(e, data){
		if($scope.role == "investor") {
			$log.log("Investors cannot use book view");
			$location.path('/registry');
		}

	});

	$scope.getRole = function() {
		book.getRole()
			.then(function(response){
				$scope.role = response.data.result.message;
			}, function(){

			});
	};

	$scope.getOrderbook = function() {
		book.getOrderbook()
			.then(function(response){
				$scope.orderbook = angular.fromJson(response.data.result.message);
			}, function(){

			});
	};

	$scope.updateDealStatus = function() {
		book.updateDealStatus($scope.dealConfig.bookStatus);
	};

	$scope.addOrder = function() {
		book.addOrder($scope.newOrder.investor, $scope.newOrder.amount);
	};

	$scope.allocateOrder = function(order) {
		book.allocateOrder(order.investor, order.alloc);
	}

	$scope.getDealConfig = function() {
		book.getDealConfig()
			.then(function(response){
				$scope.dealConfig = angular.fromJson(response.data.result.message);
			});
	}

	init();
	function init() {
		book = BookService.fromDeploymentId($routeParams.deploymentId);

		$scope.getDealConfig();
		$scope.getOrderbook();

	}

});