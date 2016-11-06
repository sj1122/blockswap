var client_factory = require('node-rest-client').Client;
var client = new client_factory();

var PEER_NODE_URL_BASE = "http://192.168.99.100:7050";

var CHAINCODE_API_URL = PEER_NODE_URL_BASE + "/chaincode";

var CHAINCODE_URL = "https://github.com/habond/blockswap/chaincode";

console.log("Deploying Chaincode");
client.post(CHAINCODE_API_URL, CreateDeployPayload(CHAINCODE_URL, "init", ["hi there"]), function (data, response) {
	console.log(data);
    var chaincode_id = data.result.message;
	console.log("Getting Value");
	client.post(CHAINCODE_API_URL, CreateQueryPayload(chaincode_id, "getOrder", ["hello_world"]), function (data, response) {
		console.log(data);
	});
});

function CreateDeployPayload(url, fn, args) {
	return {
		data: { 
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
			    }
			}, 
			"id": 1
		},
		headers: { "Content-Type": "application/json" }
	};
}

function CreateQueryPayload(id, fn, args) {
	return { 
	    data: {
			"jsonrpc": "2.0",
			"method": "query",
			"params": {
				"type": 1,
				"chaincodeID": {
					"name": id
				},
				"ctorMsg": {
					"function": fn,
					"args": args
				}
			},
			"id": 2
		},
		headers: { "Content-Type": "application/json" }
	};	
}

function CreateInvokePayload(id, fn, args) {
	return {
		data: {
			"jsonrpc": "2.0",
			"method": "invoke",
			"params": {
				"type": 1,
				"chaincodeID": {
					"name": id
				},
				"ctorMsg": {
					"function": fn,
					"args": args
				},
			},
			"id": 3
		},
		headers: { "Content-Type": "application/json" }
	};
}