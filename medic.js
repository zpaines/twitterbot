var sha512 = require('js-sha512');

var exports = module.exports = {};

exports.sanitize = function (text) {
	var match = /[<>;&\*\\/\^_~()]/gi;
	return text.replace(match, '');
}

exports.hashPass = function (password) {
	return sha512(password);
}

exports.validateUser = function (user, password) {
	return (sha512(password) == user.hashedPassword);
}

exports.checkKeys = function (body, fields) {
	var errorMessage = '';
	var key = '';

	// Ensure all fields exist
	for (var i = 0; i < fields.length; i++) {
		key = fields[i];
		if (!(key in body)) {
			errorMessage += key + ' missing!;';
		}
	}

	return errorMessage;
}

exports.requireAuth = function (req, res, next) {
	if (req.isAuthenticated() != true) {
		res.status(215).send({error: 'Not authorized'});
	} else {
		next();
	}
}