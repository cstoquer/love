var express = require('express');
var http    = require('http');
var path    = require('path');
var fs      = require('fs');
var minify  = require('uglify-js');
var io      = require('socket.io');
var commander = require('commander');

var getComponentList = require('./getComponentList');
var getAssetList     = require('./getAssetList');
var handle_INCLUDE   = require('./handle_INCLUDE');
var handle_REPLACE   = require('./handle_REPLACE');
var stringExtraction = require('./stringExtraction');




commander.option('-s, --script <path>', 'path to the script folder');
// commander.option('-a, --asset <path>',  'path to the asset folder');
commander.option('-m, --main <path>',   'main entry point file name');
commander.option('-d, --devmode',       'set development mode');
commander.option('-e, --export',        'write builded files on disc');
commander.parse(process.argv);


var rootDir = process.cwd();
var scriptDir = commander.script || 'www';
var assetDir  = commander.asset  || scriptDir + '/asset';
var mainJs    = commander.main   || 'main.js';
var DEVELOPMENT_MODE = commander.devmode;

if (DEVELOPMENT_MODE) console.log('set to development mode');
else console.log('production mode');

//██████████████████████████████████████████████████
//██████████████████████████████████████████████████
//█▀▄▄▄▄▀█▄ ██ ▄█▄ ▀▄▄▀█▄ ▀▄▄▄█▀▄▄▄▄▀█▀▄▄▄▄ █▀▄▄▄▄ █
//█ ▄▄▄▄▄███  ████ ███ ██ █████ ▄▄▄▄▄██▄▄▄▄▀██▄▄▄▄▀█
//█▄▀▀▀▀▀█▀ ██ ▀██ ▀▀▀▄█▀ ▀▀▀██▄▀▀▀▀▀█ ▀▀▀▀▄█ ▀▀▀▀▄█
//███████████████▀ ▀████████████████████████████████

var app = express();


app.set('port', process.env.PORT || 3000);
app.set('views', path.join(rootDir, 'views'));
// app.set('view engine', 'jade');

app.use(express.favicon(path.join(rootDir, scriptDir, 'favicon.ico')));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

app.use('/', express.static(path.join(rootDir, scriptDir)));


require('./loveLogo');


//███████████████████████████████████████████████████████
//███▄███████████████▄ ████████████████████████▄█████████
//█▄▄ ███▄ ▀▄▄▀██▀▄▄▄▀ ██▀▄▄▄▄▀█▄ ██ ▄███████▄▄▄ █▀▄▄▄▄ █
//███ ████ ███ ██ ████ ██ ▄▄▄▄▄███  ████████████ ██▄▄▄▄▀█
//█▀▀ ▀▀█▀ ▀█▀ ▀█▄▀▀▀▄ ▀█▄▀▀▀▀▀█▀ ██ ▀██  ██████ █ ▀▀▀▀▄█
//███████████████████████████████████████████▀▀▀▄████████

function saveScriptLocal(source, fileName) {
	var filePath = path.join(rootDir, scriptDir, fileName)
	fs.writeFileSync(filePath, source, { encoding: 'utf8' });
}

app.get('/index.js', function (req, res) {
	try {
		var source = fs.readFileSync(path.join(rootDir, scriptDir, mainJs), { encoding: 'utf8' });

		// browse all components in project
		var components = getComponentList(scriptDir);

		// pack project
		source = handle_INCLUDE(source, components, scriptDir, DEVELOPMENT_MODE);
		source = handle_REPLACE(source, '#REPLACE', DEVELOPMENT_MODE);
		if (!DEVELOPMENT_MODE) source = stringExtraction(source);

		// wrap all code in a function
		source = '(function () {\n' + source + '\n})();';

		// in development mode don't minify code
		if (DEVELOPMENT_MODE) {
			// save a version on disc
			if (commander.export) saveScriptLocal(source, 'index.js');
			return res.send(source);
		}

		// minify js code
		var ast = minify.parser.parse(source);
		ast = minify.uglify.ast_mangle(ast);
		ast = minify.uglify.ast_squeeze(ast);
		source = minify.uglify.gen_code(ast);

		// save a version on disc
		if (commander.export) saveScriptLocal(source, 'index.js');

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
	var result = getAssetList(assetDir);

	// save a version on disc
	result = JSON.stringify(result);
	if (commander.export) saveScriptLocal(result, 'asset.json');

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