'use strict';

var path = require('path');
var fs   = require('fs');

module.exports = function (scriptDir) {
	var componentList = {};
	var rootDir = process.cwd();

	function getComponentList(dir, subdir) {
		var assetList = fs.readdirSync(path.join(rootDir, dir));

		// get directories list
		var dirList = assetList.filter(function (fileName) {
			// don't process asset content
			// TODO: we should probably remove asset folder from www
			if (dir === scriptDir && fileName === 'asset') return false;
			var stats = fs.statSync(path.join(rootDir, dir, fileName));
			return stats.isDirectory();
		});

		// get javascript files
		var jsScriptList = assetList.filter(function (fileName) {
			var isJs  = fileName.search(/\.js$/)  !== -1;
			return isJs;
		});

		// add javascript path
		for (var i = 0, len = jsScriptList.length; i < len; i++) {
			var fileName = jsScriptList[i];
			var id = path.join(subdir, fileName).replace(/\\/gi, '/');
			var withoutExt = fileName.split('.');
			withoutExt.pop();
			withoutExt = withoutExt.join('.');
			if (componentList[withoutExt]) {
				var error = 'Component name conflict: ' + withoutExt + '\n';
				error += componentList[withoutExt] + '\n';
				error += id + '\n';
				throw new Error(error);
			}
			componentList[withoutExt] = id;
		}

		// recurse on subdirectories
		for (var i = 0, len = dirList.length; i < len; i++) {
			var id = dirList[i];
			getComponentList(path.join(dir, id), path.join(subdir, id));
		}
	}

	getComponentList(scriptDir, '');
	return componentList;
};
