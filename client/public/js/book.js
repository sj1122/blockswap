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

		"createDeal": function(issuer, banks, bookStatus, docRegAddress, requiredDocs) {
			var nonce = Math.random().toString();
			var config = angular.toJson({
				"issuer": issuer,
				"banks": banks,
				"bookStatus": bookStatus,
				"docRegAddress": docRegAddress,
				"requiredDocs": requiredDocs
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

.controller("BookController", function($log, $scope, $location, $routeParams, $interval, BookService){

	var book = null;

	$scope.pendingBookStatusUpdate = null;
	$scope.deployingAllocs = {};

	$scope.$on('blockchain event', function(e, d){
		if(d.event == "Book Status Change") {
			if($scope.pendingBookStatusUpdate == d.id) {
				$scope.pendingBookStatusUpdate = null;
			}
			$scope.getDealConfig();
		} else if(d.event == "Order Added") {
			$scope.getOrderbook();
		} else if(d.event == "Order Confirmed") {
			$scope.getOrderbook();
		} else if(d.event == "Order Allocated") {
			$scope.getOrderbook();
			angular.forEach($scope.deployingAllocs, function(val, key){
				if(val == d.id) {
					$scope.deployingAllocs[key] = null;
				}
			});
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
			});
	};

	$scope.getOrderbook = function() {
		book.getOrderbook()
			.then(function(response){
				$scope.orderbook = angular.fromJson(response.data.result.message);
				var orders = Object.keys($scope.orderbook).map(function(key){return $scope.orderbook[key]})
				$scope.sumIoi = orders.map(function(order){ return order.ioi; })
					.reduce(function(a,b){ return a+b; }, 0);
				$scope.sumAlloc = orders.map(function(order){ return order.alloc; })
					.reduce(function(a,b){ return a+b; }, 0);

			});
	};

	$scope.updateDealStatus = function() {
		$scope.pendingBookStatusUpdate = "pending"
		book.updateDealStatus($scope.dealConfig.bookStatus)
			.then(function(response){
				var transactionId = response.data.result.message;
				$scope.pendingBookStatusUpdate = transactionId;
			});
	};

	$scope.addOrder = function() {
		book.addOrder($scope.newOrder.investor, $scope.newOrder.amount);
	};

	$scope.allocateOrder = function(order) {
		$scope.deployingAllocs[order.investor] = "pending";
		$log.log("Allocating order for " + order.investor + " with value " + order.alloc);
		book.allocateOrder(order.investor, order.alloc)
			.then(function(response){
				var deploymentId = response.data.result.message;
				$scope.deployingAllocs[order.investor] = deploymentId;
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

	$scope.getDealConfig = function() {
		book.getDealConfig()
			.then(function(response){
				$scope.dealConfig = angular.fromJson(response.data.result.message);
			});
	};

	$scope.transferPerc = 0.0;
	$scope.doTransfer = function() {
		var cancel = $interval(function(){
			if($scope.transferPerc == 1) {
				$interval.cancel(cancel);
				$scope.pendingBookStatusUpdate = "pending"
				book.updateDealStatus('settled')
					.then(function(response){
						var transactionId = response.data.result.message;
						$scope.pendingBookStatusUpdate = transactionId;
						$scope.getDealConfig();
					});
			} else {
				var next = $scope.transferPerc + 0.01;
				$scope.transferPerc = next > 1 ? 1 : next;
			}
		}, 10);
	};

	init();
	function init() {
		book = BookService.fromDeploymentId($routeParams.deploymentId);

		$scope.getDealConfig();
		$scope.getOrderbook();

	};

});