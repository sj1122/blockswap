angular.module("blockswap")

.constant("DOC_GITHUB_LOCATION", "https://github.com/sj1122/blockswap/tree/demo/chaincode/DocRegistry")

.factory("DocService", function(ChaincodeService, DOC_GITHUB_LOCATION) {

	var fns = {

		"declareDoc": function(docType) {
			return ChaincodeService.invoke(this.deploymentId, "declareDoc", [docType]);
		},

		"getDocsFor": function(company) {
			return ChaincodeService.query(this.deploymentId, "getDocs", [company]);
		},

		"getDocsForAllCompanies": function() {
			return ChaincodeService.query(this.deploymentId, "getDocsForAllCompanies", []);
		}

	};

	return {

		"deployDocs": function() {
			var nonce = Math.random().toString();
			return ChaincodeService.deploy(DOC_GITHUB_LOCATION, "init", [nonce])
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

.controller("DocController", function($scope, $log, $location, KeyStoreService, DocService) {

	var docRegistry = null;

	$scope.deployingDoc = {};

	KeyStoreService.get("DocRegistry")
		.then(function(response){
			var deploymentId = response.data;
			docRegistry = DocService.fromDeploymentId(deploymentId);
			if($scope.role == 'regulator' || $scope.role == 'bank') {
					docRegistry.getDocsForAllCompanies()
					.then(function(response){
						$scope.allDocs = angular.fromJson(response.data.result.message);
					});
			} else {
				docRegistry.getDocsFor($scope.username)
					.then(function(response){
						$scope.myDocs = angular.fromJson(response.data.result.message);
					});
			}

		});

	$scope.$on("user changed", function(e, data){
		roleCheck();
		if(docRegistry) {
			docRegistry.getDocsFor($scope.username)
				.then(function(response){
					$scope.myDocs = angular.fromJson(response.data.result.message);
				});
		}
	});

	$scope.$on('blockchain event', function(e, d){
		if(d.event == "New Doc Registered") {
			angular.forEach($scope.deployingDoc, function(val, key){
				if(val == d.id) {
					$scope.deployingDoc[key] = null;
				}
				docRegistry.getDocsFor($scope.username)
					.then(function(response){
						$scope.myDocs = angular.fromJson(response.data.result.message);
					});
			});
		}
	});


	$scope.declareDoc = function(doc) {
		$scope.deployingDoc[doc] = "pending";
		docRegistry.declareDoc(doc)
			.then(function(response){
				var deploymentId = response.data.result.message;
				$scope.deployingDoc[doc] = deploymentId;
			});
	};

	roleCheck();
	function roleCheck() {
		if($scope.role != 'regulator' && $scope.role != 'bank' && $scope.role != 'investor') {
			$log.log("Only regulators, banks and investors can use docs");
			$location.path('/registry');
		}
	}

});
