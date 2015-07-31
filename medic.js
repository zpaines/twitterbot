var exports = module.exports = {};

exports.sanitize = function (text) {
	var match = /[<>;&\*\\/\^_~()]/gi;
	return text.replace(match, '');
}