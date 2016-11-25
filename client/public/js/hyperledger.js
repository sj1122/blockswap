angular.module("blockswap")

.constant("HYPERLEDGER_ENDPOINT_URL", "http://192.168.99.100:7050")

.constant("HYPERLEDGER_POLLING_INTERVAL", 5000)

.constant("BLOCKSWAP_ATTRIBUTES", ["role", "company"])

.factory("ChaincodeService", function($rootScope, $http, $q, $log, HYPERLEDGER_ENDPOINT_URL, BLOCKSWAP_ATTRIBUTES){

	var chaincodeRequestId = 1;
	var pendingDeployments = [];

	$rootScope.$on('new blocks', function(){
		CheckPendingDeployments();
	});

	function CheckPendingDeployments() {
		var deploymentPingPromises = pendingDeployments.map(function(deploymentId) {
			return exports.ping(deploymentId);
		});
		$q.all(deploymentPingPromises)
			.then(function(responses){
				angular.forEach(responses, function(response, i){
					ProcessDeployedContract(pendingDeployments[i], response);
				});
			});
	}

	function ProcessDeployedContract(deploymentId, response) {
		$log.log("New Contract Deployed: " + deploymentId);
		var message = response.data.result.message;
		if(message == "pong") {
			var i = pendingDeployments.indexOf(deploymentId);
			pendingDeployments.splice(i, 1);
			$rootScope.$broadcast('blockchain event', {
				'id': deploymentId,
				'event': "Contract Deployed",
				'data': deploymentId
			});
		}
	}

	var exports = {

		"chain": function() {
			return $http.get(HYPERLEDGER_ENDPOINT_URL + "/chain");
		},

		"block": function(i) {
			return $http.get(HYPERLEDGER_ENDPOINT_URL + "/chain/blocks/" + i);
		},

		"registrar": function(username, password) {
			return $http.post(HYPERLEDGER_ENDPOINT_URL + "/registrar", {
				"enrollId": username,
				"enrollSecret": password
			});
		},

		"deploy": function(url, fn, args) {
			return $http.post(HYPERLEDGER_ENDPOINT_URL + "/chaincode", {
				"jsonrpc": "2.0", 
				"method": "deploy", 
				"params": { 
					"type": 1, 
					"chaincodeID": { 
						"path": url
					}, 
					"ctorMsg": {
				      "function": fn,
				      "args": args
				    },
				    "secureContext": $rootScope.username,
				    "attributes": BLOCKSWAP_ATTRIBUTES
				}, 
				"id": (chaincodeRequestId++)
			}).then(function(response){
				var deploymentId = response.data.result.message;
				pendingDeployments.push(deploymentId);
				return response;
			});
		},

		"query": function(deploymentId, fn, args) {
			return $http.post(HYPERLEDGER_ENDPOINT_URL + "/chaincode", {
				"jsonrpc": "2.0",
				"method": "query",
				"params": {
					"type": 1,
					"chaincodeID": {
						"name": deploymentId
					},
					"ctorMsg": {
						"function": fn,
						"args": args
					},
					"secureContext": $rootScope.username,
				    "attributes": BLOCKSWAP_ATTRIBUTES
				},
				"id": (chaincodeRequestId++)
			});
		},

		"invoke": function(deploymentId, fn, args) {
			return $http.post(HYPERLEDGER_ENDPOINT_URL + "/chaincode", {
				"jsonrpc": "2.0",
				"method": "invoke",
				"params": {
					"type": 1,
					"chaincodeID": {
						"name": deploymentId
					},
					"ctorMsg": {
						"function": fn,
						"args": args
					},
					"secureContext": $rootScope.username,
				    "attributes": BLOCKSWAP_ATTRIBUTES
				},
				"id": (chaincodeRequestId++)
			});
		},

		"ping": function(deploymentId) {
			return this.query(deploymentId, "ping", []);
		}

	};

	return exports;

})

.factory("ChaincodeEventMonitor", function($rootScope, $log, $interval, $q, ChaincodeService, HYPERLEDGER_POLLING_INTERVAL){

	var currentBlock = null;
	var intervalStop = null;
	var locked = false;

	return {
		'start': start
	};

	function start() {
		ChaincodeService.chain()
			.then(function(response){
				currentBlock = response.data.height - 1;
				$log.debug("Starting listener at block " + currentBlock);
				schedule();
			});
	}

	function schedule() {
		intervalStop = $interval(function(){

			if(locked) {
				$log.debug("Lock is set so skipping event loop");
				return;
			}
			ChaincodeService.chain()
				.then(function(response){
					var newHighestBlock = response.data.height - 1;
					$log.debug("Highest block is currently " + newHighestBlock);
					if(newHighestBlock > currentBlock) {
						$log.debug("Unprocessed blocks exist");
						$rootScope.$broadcast('new blocks', {'from': currentBlock+1, 'to': newHighestBlock});
						processNewBlocks(currentBlock+1, newHighestBlock);
					}
				});

		}, HYPERLEDGER_POLLING_INTERVAL);
	}

	function processNewBlocks(start, end) {
		$log.debug("Locking event process");
		lock = true;
		$log.debug("processing blocks " + start + " to block " + end);
		var newBlockPromises = [];
		for(var i=start; i<=end; i++) {
			newBlockPromises.push(ChaincodeService.block(i));
		}
		$q.all(newBlockPromises)
			.then(function(responses){
				angular.forEach(responses, function(response, i) {
					$log.debug("processing block " + (start+i));
					processBlockEvents(response);
				});
				currentBlock = end;
			})
			.finally(function(){
				$log.debug("Unlocking event process");
				lock = false;
			});
	}

	function processBlockEvents(response) {
		var events = response.data.nonHashData.chaincodeEvents;
		angular.forEach(events, function(evt){
			if(!evt.txID)
				return;
			var txid = evt.txID;
			var event = evt.eventName;
			var data = atob(evt.payload);
			$rootScope.$broadcast('blockchain event', {
				'id': txid,
				'event': event,
				'data': data
			});
		});
	}

});