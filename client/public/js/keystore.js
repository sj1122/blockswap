angular.module("blockswap")

.factory("KeyStoreService", function($http) {

	return {

		"get": function(key) {
			return $http.get("http://localhost:3000/keystore/" + key);
		},

		"set": function(key, val) {
			return $http.post("http://localhost:3000/keystore/" + key + "/" + val);
		}

	};

});
