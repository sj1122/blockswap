angular.module("blockswap")

.constant("USER_MAP", {

	"snapchat": {
		"name": "FlapChat Inc.",
		"role": "issuer",
		"acctNo": 8288,
		"password": "snappwd"
	},

	"abnb": {
		"name": "Whiffbnb",
		"role": "issuer",
		"acctNo": 1928,
		"password": "abpwd"
	},

	"ptir": {
		"name": "Palancheer",
		"role": "issuer", 
		"acctNo": 6758,
		"password": "ptripwd"
	},

	"uber": {
		"name": "Buber",
		"role": "issuer", 
		"acctNo": 5588,
		"password": "uberpwd"
	},

	"bofa": {
		"name": "Bank of Murica",
		"role": "bank",
		"acctNo": 1929,
		"password": "bamlpwd"
	},

	"jpm": {
		"name": "JP Freeman Chased",
		"role": "bank",
		"acctNo": 9111,
		"password": "jppwd"
	},

	"gs": {
		"name": "Silverman Sachs",
		"role": "bank",
		"acctNo": 1434,
		"password": "gspwd"
	},

	"brock": {
		"name": "White Pebble",
		"role": "investor", 
		"acctNo": 7591,
		"password": "brpwd"
	},

	"fdlty": {
		"name": "Foodelity",
		"role": "investor",
		"acctNo": 4431,
		"password": "ftypwd"
	},

	"vang": {
		"name": "Truckguard",
		"role": "investor",
		"acctNo": 1189,
		"password": "vangpwd"
	},

	"pimco": {
		"name": "Pimcool",
		"role": "investor",
		"acctNo": 0897, 
		"password": "pimpwd"
	},

	"amundi": {
		"name": "Amoondi",
		"role": "investor",
		"acctNo": 0897,
		"password": "amunpwd"
	},

	"dtc": {
		"name": "DeeTeeCee",
		"role": "clearing_house", 
		"password": "dtcpwd"
	},

	"sec": {
		"name": "URITY",
		"role": "regulator", 
		"password": "secpwd"
	},

	"finra": {
		"name": "GILLRA",
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
			$scope.usermap = USER_MAP;
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