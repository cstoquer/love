'use strict';

module.exports = function (source, command, isDevMode) {
	var commandLength = command.length;
	var re = new RegExp("("+command+"\\([A-Za-z0-9\\{\\,\\:\\\"\\#\\_\\$\\s\\t\\n\\r\\[\\]\\}]*\\))");
	var splited = source.split(re);
	var replace = {};
	for (var i = 0; i < splited.length; i++) {
		var s = splited[i];
		if (s.substring(0,commandLength) === command) {
			var data = s.substring(9, s.length - 1);
			try {
				data = JSON.parse(data);
			} catch (e) {
				throw new Error('Could not parse JSON object in ' + command + ' command.');
			}
			for (var keys = Object.keys(data), k = 0, len = keys.length; k < len; k++) {
				var key = keys[k];
				replace[key] = (typeof data[key] === 'string') ? data[key] : data[key][~~isDevMode];
			}
			// remove source code portion
			splited[i] = '';
		}
	}
	// reconstruct source minus #command portions
	source = splited.join('');

	// replace keywords in all source code
	for (var keys = Object.keys(replace), k = 0, len = keys.length; k < len; k++) {
		var key = keys[k];
		var keyword = key.replace(/\$/gi, '\\$');
		var regexp = new RegExp(keyword, 'gi');
		source = source.replace(regexp, replace[key]);
	}

	return source;
}