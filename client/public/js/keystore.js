angular.module("blockswap")

.factory("KeyStoreService", function($http) {

	return {

		"get": function(key) {
			return $http.get("/keystore/" + key);
		},

		"set": function(key, val) {
			return $http.post("/keystore/" + key + "/" + val);
		}

	};

});