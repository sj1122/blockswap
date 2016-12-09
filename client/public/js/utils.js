angular.module("blockswap")

.filter("capitalizeFirstLetter", function() {

    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    };
})

.filter("desnakeCase", function() {

	return function(input) {
		if(!input)
			return '';
		return input.split("_")
			.map(function(word){ return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase(); })
			.join(" ");
	};

})

.filter("username2company", function(USER_MAP) {

	return function(username) {
		return (!!username) ? USER_MAP[username].name  : '';
	};

})

.filter("username2acctno", function(USER_MAP) {

	return function(username) {
		return (!!username) ? USER_MAP[username].acctNo : '';
	};

})

.filter("username2role", function(USER_MAP) {

	return function(username) {
		return (!!username) ? USER_MAP[username].role : '';
	};

})

.filter("counter", function() {

	return function(value, percentage, direction) {
		if(direction == "down")
			percentage = 1 - percentage;
		return (value ? value : 0) * percentage;
	};

});