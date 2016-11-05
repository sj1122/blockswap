var client_factory = require('node-rest-client').Client;
var client = new client_factory();

var PEER_NODE_URL_BASE = "http://192.168.99.100:7050";

var CHAINCODE_API_URL = PEER_NODE_URL_BASE + "/chaincode";

var CHAINCODE_URL = "https://github.com/habond/blockswap/chaincode";

var args = {
	data: { 
		"jsonrpc": "2.0", 
		"method": "deploy", 
		"params": { 
			"type": 1, 
			"chaincodeID": { 
				"path": CHAINCODE_URL
			}, 
			"ctorMsg": { 
				"args": ["init", "a", "1000", "b", "2000"] 
			}
		}, 
		"id": 1
	},
	headers: { "Content-Type": "application/json" }
};

client.post(CHAINCODE_API_URL, args, function (data, response) {
    // parsed response body as js object
    //console.log(data);
    // raw response
    console.log(response);
});