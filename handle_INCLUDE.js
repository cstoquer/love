'use strict';

var path = require('path');
var fs   = require('fs');

var handle_REPLACE = require('./handle_REPLACE');


//███▀██▀████████████████████████████████████████████████████
//██▀▄█▀▄█▄▄ ▄▄█▄  ██▄ ▄██▀▄▄▄ █▄ ▄████▄ ▄█▄ ▄█▄ ▄▄▀██▄ ▄▄▄ █
//█▄ ▄▄ ▄███ ████ █ ██ ██ ███████ ██████ ███ ███ ███ ██ ▀ ███
//█▀ ▀▀ ▀███ ████ ██ █ ██ ███████ ███▀██ ███ ███ ███ ██ █▄███
//█▀▄█▀▄██▀▀ ▀▀█▀ ▀██  ███▄▀▀▀▄█▀ ▀▀▀ ██▄▀▀▀▄██▀ ▀▀▄██▀ ▀▀▀ █
//█▄██▄██████████████████████████████████████████████████████

module.exports = function (source, components, isDevMode) {
	// the list of already included components
	var includedComponents = {};

	function handle_INCLUDE(source) {
		// extract all #INCLUDE commands
		var splited = source.split(/(#INCLUDE\([A-Za-z0-9\.\_\-\$]*\))/);
		var includes = [];
		for (var i = 0; i < splited.length; i++) {
			var s = splited[i];
			if (s.substring(0,8) === '#INCLUDE') {
				var componentName = s.substring(9, s.length - 1);
				includes.push({ index: i, componentName: componentName });
			}
		}

		for (var i = 0; i < includes.length; i++) {
			var include = includes[i];
			var componentName = include.componentName;

			var filePath = components[componentName];
			if (!filePath) throw new Error('Component name not found: ' + componentName);

			// test if componentName has already been included
			if (includedComponents[componentName]) {
				splited[include.index] = '';
				continue;
			}
			includedComponents[componentName] = true;

			// read the file and get the real content
			var fileContent = fs.readFileSync(path.join(__dirname, 'www', filePath), { encoding: 'utf8' });

			try {
				// handle PRIVATE keywords
				fileContent = handle_REPLACE(fileContent, '#PRIVATE', isDevMode);

				// recurse file inclusion on fileContent
				fileContent = handle_INCLUDE(fileContent);
			} catch (e) {
				throw new Error('in file www/' + filePath + '\n' + e.message);
			}

			// insert file content in place of #INCLUDE command
			include.fileContent = fileContent;
			var index = include.index;
			splited[index] = include.fileContent;
		}

		// Reconstruct script
		return splited.join('');
	}

	return handle_INCLUDE(source);
};