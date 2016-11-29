angular.module("blockswap")

.constant("DOC_GITHUB_LOCATION", "https://github.com/habond/blockswap/chaincode/DocRegistry")

.factory("DocService", function(ChaincodeService, DOC_GITHUB_LOCATION){

	var fns = {

		"declareDoc": function(docType) {
			return ChaincodeService.invoke(this.deploymentId, "declareDoc", [docType]);
		},

		"getDocsFor": function(company) {
			return ChaincodeService.query(this.deploymentId, "getDocs", [company]);
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

});