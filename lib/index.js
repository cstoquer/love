var DEVELOPMENT_MODE = false;

/**
 * LOVE
 * version 0.0.7
 *
 * @author Cedric Stoquer
 *
 *
 *
 * TODO - Feature & Idea list
 * --------------------------
 * ~ Make express server less verbose
 *
 * ~ A new #COMMENT tag to add some comments that will not be minified 
 *   (added back after minification)
 *
 * ~ Generic code for request. Ideally, the code could be provided by
 *   the client to execute on server (e.g. save a file to disc).
 *   Or this could be a set of user commands. ???
 *   To prevent security flaw, this type of request should be disabled
 *   with a flag (DEVELOPMENT_MODE ?)
 *
 * ~ Tag directories as ARRAY#dirname, and store content as array, 
 *   ordered by filename (this is kind of already be done if we name
 *   the files like "0", "1", "2", etc.)
 *   ==> we can just add a length property ?
 *
 * ~ be able to change server DEVELOPMENT_MODE with a request from 
 *   the frontend ??
 *
 * ~ in the index.js, add the preloading function call ?
 *   ==> this implies to add the loading module by default (no needs
 *       to be #INCLUDED by developer ).
 *   by default, the preloading call the function main when loading
 *   is done.
 *   ==> add #INCLUDE(loading.js) at the begining of main.js file
 *   ==> add at the end of main.js file the following code :
 *		//---------------------------------------
 *		preloadAssets(function (error, assets) {
 *			if (error) return console.error(error);
 *			main(assets);
 *		});
 *		//---------------------------------------
 *   
 */

var express = require('express');
var http    = require('http');
var path    = require('path');
var fs      = require('fs');
var minify  = require('uglify-js');
var io      = require('socket.io');

var getComponentList = require('./getComponentList');
var getAssetList     = require('./getAssetList');
var handle_INCLUDE   = require('./handle_INCLUDE');
var handle_REPLACE   = require('./handle_REPLACE');
var stringExtraction = require('./stringExtraction');

require('./loveLogo');


//██████████████████████████████████████████████████
//██████████████████████████████████████████████████
//█▀▄▄▄▄▀█▄ ██ ▄█▄ ▀▄▄▀█▄ ▀▄▄▄█▀▄▄▄▄▀█▀▄▄▄▄ █▀▄▄▄▄ █
//█ ▄▄▄▄▄███  ████ ███ ██ █████ ▄▄▄▄▄██▄▄▄▄▀██▄▄▄▄▀█
//█▄▀▀▀▀▀█▀ ██ ▀██ ▀▀▀▄█▀ ▀▀▀██▄▀▀▀▀▀█ ▀▀▀▀▄█ ▀▀▀▀▄█
//███████████████▀ ▀████████████████████████████████

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(express.favicon(path.join(__dirname, 'www/favicon.ico')));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

app.use('/', express.static(process.cwd() + '/www'));


//███████████████████████████████████████████████████████
//███▄███████████████▄ ████████████████████████▄█████████
//█▄▄ ███▄ ▀▄▄▀██▀▄▄▄▀ ██▀▄▄▄▄▀█▄ ██ ▄███████▄▄▄ █▀▄▄▄▄ █
//███ ████ ███ ██ ████ ██ ▄▄▄▄▄███  ████████████ ██▄▄▄▄▀█
//█▀▀ ▀▀█▀ ▀█▀ ▀█▄▀▀▀▄ ▀█▄▀▀▀▀▀█▀ ██ ▀██  ██████ █ ▀▀▀▀▄█
//███████████████████████████████████████████▀▀▀▄████████

app.get('/index.js', function (req, res) {
	try {
		var source = fs.readFileSync(process.cwd() + '/www/main.js', { encoding: 'utf8' });

		// browse all components in project
		var components = getComponentList();

		// pack project
		source = handle_INCLUDE(source, components, DEVELOPMENT_MODE);
		source = handle_REPLACE(source, '#REPLACE', DEVELOPMENT_MODE);
		if (!DEVELOPMENT_MODE) source = stringExtraction(source);

		// wrap all code in a function
		source = '(function () {\n' + source + '\n})();';

		// in development mode don't minify code
		if (DEVELOPMENT_MODE) {
			// save a version on disc
			fs.writeFileSync(process.cwd() + '/www/index.js', source, { encoding: 'utf8' });
			return res.send(source);
		}

		// minify js code
		var ast = minify.parser.parse(source);
		ast = minify.uglify.ast_mangle(ast);
		ast = minify.uglify.ast_squeeze(ast);
		source = minify.uglify.gen_code(ast);

		// save a version on disc
		fs.writeFileSync(process.cwd() + '/www/index.js', source, { encoding: 'utf8' });

		res.send(source);
	} catch (e) {
		console.log('\n\033[101;30m  ***  Error  ***  \033[0;91m\n' + e.message + '\033[0m\n');
		console.log(e.stack);
		res.send('console.error("' + e.message.replace(/\n/g, '\\n') + '");');
	}
});


//██████████████████████████████████████████████████████████████████████
//███████████████████████████████▀█████████████▄ █████▄███████████▀█████
//█▀▄▄▄▄▀██▀▄▄▄▄ █▀▄▄▄▄ █▀▄▄▄▄▀█▄ ▄▄▄███████████ ███▄▄ ███▀▄▄▄▄ █▄ ▄▄▄██
//█▀▄▄▄▄ ███▄▄▄▄▀██▄▄▄▄▀█ ▄▄▄▄▄██ ██████████████ █████ ████▄▄▄▄▀██ █████
//█▄▀▀▀▄ ▀█ ▀▀▀▀▄█ ▀▀▀▀▄█▄▀▀▀▀▀██▄▀▀▀▄████████▀▀ ▀▀█▀▀ ▀▀█ ▀▀▀▀▄██▄▀▀▀▄█
//██████████████████████████████████████████████████████████████████████

app.get('/asset.json', function (req, res) {
	var result = getAssetList();

	// save a version on disc
	result = JSON.stringify(result);
	fs.writeFileSync(process.cwd() + '/www/asset.json', result, { encoding: 'utf8' });

	res.send(result);
});


//████████████████████████████████████████████████████
//██████████████████████████████████████████████▀█████
//█▄ ▀▄▄▄█▀▄▄▄▄▀█▀▄▄▄▀ ▄█▄ ██▄ ██▀▄▄▄▄▀█▀▄▄▄▄ █▄ ▄▄▄██
//██ █████ ▄▄▄▄▄█ ████ ███ ███ ██ ▄▄▄▄▄██▄▄▄▄▀██ █████
//█▀ ▀▀▀██▄▀▀▀▀▀█▄▀▀▀▄ ███▄▀▀▄ ▀█▄▀▀▀▀▀█ ▀▀▀▀▄██▄▀▀▀▄█
//███████████████████▀ ▀██████████████████████████████

app.post('/req', function (req, res) {
	// TODO: put here your code to handle requests from client
	console.log(req.body);
	res.send(req.body);
});


//█████████████████████████████████████████████
//█████████████████████████████████████████████
//█▀▄▄▄▄ █▀▄▄▄▄▀█▄ ▀▄▄▄█▄ ▄██▄ ▄█▀▄▄▄▄▀█▄ ▀▄▄▄█
//██▄▄▄▄▀█ ▄▄▄▄▄██ ███████ ██ ███ ▄▄▄▄▄██ █████
//█ ▀▀▀▀▄█▄▀▀▀▀▀█▀ ▀▀▀█████  ████▄▀▀▀▀▀█▀ ▀▀▀██
//█████████████████████████████████████████████

var server = http.createServer(app);
server.listen(app.get('port'), function () {
	console.log('Express server listening on port ' + app.get('port'));
});


//████████████████████████████████████████████████████
//████████████████████▄░████████████▀████████▄████████
//██▀▄▄▄░█▀▄▄▄▀█▀▄▄▀░██░█▄░▄█▀▄▄▄▀█▄░▄▄█████▄░██▀▄▄▄▀█
//███▄▄▄▀█░███░█░██████░▄░███░▄▄▄▄██░████████░██░███░█
//██░▀▀▀▄█▄▀▀▀▄█▄▀▀▀▄█▀░██░▀█▄▀▀▀▀██▄▀▀▄█░░█▀░▀█▄▀▀▀▄█
//████████████████████████████████████████████████████
var sockets = {};

var sock = io.listen(server);
sock.set('log level', 1);

sock.sockets.on('connection', function (socket) {
	// adding socket in pool:
	var id = socket.id;
	sockets[id] = socket;

	// TODO: something with socket
	socket.on('select', function (data) {
		// TODO: we can use broadcast function available in socket.io
		for (var i in sockets) {
			sockets[i].emit('a', data);
		}
	});
});