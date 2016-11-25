angular.module("blockswap")

.constant("USER_MAP", {

	"snapchat": {
		"role": "issuer",
		"password": "snappwd"
	},

	"bofa": {
		"role": "bank", 
		"password": "bamlpwd"
	},

	"jpm": {
		"role": "bank", 
		"password": "jppwd"
	},

	"dtc": {
		"role": "clearing_house", 
		"password": "dtcpwd"
	},

	"fsa": {
		"role": "regulator", 
		"password": "fsapwd"
	},

	"brock": {
		"role": "investor", 
		"password": "brpwd"
	},

	"fdlty": {
		"role": "investor", 
		"password": "ftypwd"
	}

})

.controller("MenuController", function($rootScope, $scope, $log, ChaincodeService, KeyStoreService, USER_MAP){

	KeyStoreService.get("username")
		.then(function(response){
			var username = response.data;
			if(!username)
				return;
			var properties = USER_MAP[username];
			$rootScope.username = username;
			$rootScope.role = properties.role;
			$scope.selectedUser = username;
		});

	$scope.userChanged = function() {
		var username = $scope.selectedUser;
		var properties = USER_MAP[username];
		ChaincodeService.registrar(username, properties.password)
			.then(function(response){
				$rootScope.username = username;
				$rootScope.role = properties.role;
				KeyStoreService.set("username", username);
				$rootScope.$broadcast("user changed", {
					"username": username,
					"role": properties.role
				});
			});
	};


});