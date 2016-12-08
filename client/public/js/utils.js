angular.module("blockswap")

.filter("capitalizeFirstLetter", function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
})

.filter("username2company", function(USER_MAP) {

	return function(username) {
		return (!!username) ? USER_MAP[username].name  : '';
	}

})

.filter("username2acctno", function(USER_MAP) {

	return function(username) {
		return (!!username) ? USER_MAP[username].acctNo : '';
	}

})

.filter("counter", function() {

	return function(value, percentage, direction) {
		if(direction == "down")
			percentage = 1 - percentage;
		return (value ? value : 0) * percentage;
	}

});