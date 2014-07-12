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

require('./lib');
