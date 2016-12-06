angular.module("blockswap")

.constant("USER_MAP", {

	"snapchat": {
		"name": "SnapChat Inc.",
		"role": "issuer",
		"password": "snappwd"
	},

	"bofa": {
		"name": "Bank of America",
		"role": "bank", 
		"password": "bamlpwd"
	},

	"jpm": {
		"name": "JP Morgan Chase",
		"role": "bank", 
		"password": "jppwd"
	},

	"gs": {
		"name": "Goldman Sachs",
		"role": "bank",
		"password": "gspwd"
	},

	"dtc": {
		"name": "DTC",
		"role": "clearing_house", 
		"password": "dtcpwd"
	},

	"sec": {
		"name": "SEC",
		"role": "regulator", 
		"password": "secpwd"
	},

	"brock": {
		"name": "Black Rock",
		"role": "investor", 
		"password": "brpwd"
	},

	"fdlty": {
		"name": "Fidelity",
		"role": "investor", 
		"password": "ftypwd"
	},

	"abnb": {
		"name": "Airbnb",
		"role": "issuer", 
		"password": "abpwd"
	},

	"ptir": {
		"name": "Palantir",
		"role": "issuer", 
		"password": "ptripwd"
	},

	"uber": {
		"name": "Uber",
		"role": "issuer", 
		"password": "uberpwd"
	},

	"vang": {
		"name": "Vanguard",
		"role": "investor", 
		"password": "vangpwd"
	},

	"pimco": {
		"name": "Pimco",
		"role": "investor", 
		"password": "pimpwd"
	},

	"amundi": {
		"name": "Amundi",
		"role": "investor", 
		"password": "amunpwd"
	},

	"finra": {
		"name": "FINRA",
		"role": "regulator", 
		"password": "finpwd"
	}

})

.constant("ALERT_DURATION", 5000)

.controller("MenuController", function($rootScope, $scope, $log, $location, ChaincodeService, KeyStoreService, USER_MAP){

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

	$rootScope.userMap = USER_MAP;

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

	$scope.isMenuActive = function(test) {
		if($location.path().indexOf(test) != -1) {
			return "active";
		} else {
			return "";
		}
	};


})

.controller("AlertController", function($scope, $log, $timeout, ALERT_DURATION){

	$scope.display = false;

	$scope.$on('blockchain event', function(evt, data){
		$log.log(data);
		$scope.display = true;
		$scope.message = data.event;
		$timeout(function(){
			$scope.display = false;
			$scope.message = "";
		}, ALERT_DURATION);
	});

});