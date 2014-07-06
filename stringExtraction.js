'use strict';

//██████████████████████████████████████████████████████████████████████████████
//█▀▄▄▀░█▀██████████▄██████████████████▄░▄▄▄░████████▀█████████████████████▀████
//█▄▀▀▀█▄░▄▄█▄░▀▄▄█▄░██▄░▀▄▄▀█▀▄▄▀░▄████░▀░███▄░█░▄█▄░▄▄█▄░▀▄▄▀▄▄▄▀█▀▄▄▀░█▄░▄▄██
//█████░█░████░█████░███░███░█░███░█████░█▄█████░████░████░███▀▄▄▄░█░██████░████
//█░▄▀▀▄█▄▀▀▄▀░▀▀██▀░▀█▀░▀█▀░▀▄▀▀▄░████▀░▀▀▀░█▀░█░▀██▄▀▀▄▀░▀▀█▄▀▀▄░▀▄▀▀▀▄██▄▀▀▄█
//█████████████████████████████▀▀▀▄█████████████████████████████████████████████

module.exports = function (source) {
	// extract all string in double quote

	// TODO: handle escaped quote inside text
	// IDEA: first replace all \" by a special character, do extraction 
	//       and replace back special character

	var splited = source.split(/(\"[^\"]*\")/);
	var strings = [];
	for (var i = 0; i < splited.length; i++) {
		var s = splited[i];
		if (s.substring(0,1) === '"') {
			var str = s.substring(1, s.length - 1);
			var index = strings.indexOf(str);
			if (index === -1) index = strings.push(str) - 1;
			// replace string to reference
			splited[i] = '$$_STRING_MAP[' + index + ']';
		}
	}
	// add string map
	if (strings.length > 0) {
		splited.unshift('var $$_STRING_MAP=' + JSON.stringify(strings));
	}

	// reconstruct source code
	source = splited.join('');

	return source;
}