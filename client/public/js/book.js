angular.module("blockswap")

.constant("BOOK_GITHUB_LOCATION", "https://github.com/habond/blockswap/chaincode/Book")

.factory("BookService", function($rootScope, ChaincodeService, BOOK_GITHUB_LOCATION){

	return {

		"createDeal": function() {
			var nonce = Math.random().toString();
			return ChaincodeService.deploy(BOOK_GITHUB_LOCATION, "init", [nonce]);
		},

		"getRole": function() {
			return ChaincodeService.query($rootScope.dealDeploymentId, "getRole", []);
		},

		"getCompany": function() {
			return ChaincodeService.query($rootScope.dealDeploymentId, "getCompany", []);
		},

		"getIssuer": function() {
			return ChaincodeService.query($rootScope.dealDeploymentId, "getIssuer", []);
		},

		"getDealStatus": function() {
			return ChaincodeService.query($rootScope.dealDeploymentId, "getDealStatus", []);
		},

		"updateDealStatus": function(newStatus) {
			return ChaincodeService.invoke($rootScope.dealDeploymentId, "updateDealStatus", [newStatus]);
		},

		"getOrderbook": function() {
			return ChaincodeService.query($rootScope.dealDeploymentId, "getOrderbook", []);
		},

		"addOrder": function(investor, amount) {
			return ChaincodeService.invoke($rootScope.dealDeploymentId, "addOrder", [investor, amount.toString()])
		},

		"allocateOrder": function(investor, allocation) {
			return ChaincodeService.invoke($rootScope.dealDeploymentId, "allocateOrder", [investor, allocation.toString()]);
		}

	}

})

.controller("BookController", function($log, $rootScope, $scope, $routeParams, BookService){

	init();
	function init() {
		$rootScope.dealDeploymentId = $routeParams.deploymentId;

		$scope.events = [];
		$scope.deploymentId = null;
		$scope.dealStatus = null;

		$scope.$on('blockchain event', function(e, d){
			$scope.events.push(d);
			handleEvent(d.id, d.event, d.data);
		});

	}

	function handleEvent(txid, event, data) {
		if(event == "Book Status Change") {
			$scope.getDealStatus();
		} else if(event == "Order Added") {
			$scope.getOrderbook();
		} else if(event == "Contract Deployed") {
			if(data == $scope.deploymentId)
				$scope.deployed = "Yes";
		}
	}

	$scope.createDeal = function() {
		$log.log("Creating Deal");
		BookService.createDeal()
			.then(function(response){
				$scope.deploymentId = response.data.result.message;
				$scope.deployed = "No";
			}, function(errorResponse){

			});
	};

	$scope.getRole = function() {
		BookService.getRole()
			.then(function(response){
				$scope.role = response.data.result.message;
			}, function(){

			});
	};

	$scope.getCompany = function() {
		BookService.getCompany()
			.then(function(response){
				$scope.company = response.data.result.message;
			}, function(){

			});
	};

	$scope.getIssuer = function() {
		BookService.getIssuer()
			.then(function(response){
				$scope.issuer = response.data.result.message;
			}, function(){

			});
	};

	$scope.getDealStatus = function() {
		BookService.getDealStatus()
			.then(function(response){
				$scope.dealStatus = response.data.result.message;
			}, function(){

			});
	};

	$scope.getOrderbook = function() {
		BookService.getOrderbook()
			.then(function(response){
				$scope.orderbook = angular.fromJson(response.data.result.message);
			}, function(){

			});
	};

	$scope.updateDealStatus = function() {
		BookService.updateDealStatus("open");
	};

	$scope.addOrder = function() {
		BookService.addOrder($scope.newOrder.investor, $scope.newOrder.amount);
	};

	$scope.allocateOrder = function(order) {
		BookService.allocateOrder(order.investor, order.alloc);
	}

});