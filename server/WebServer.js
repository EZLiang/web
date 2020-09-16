const fs = require('fs');
const http = require('http');
const url = require('url');

const ManageBooksHandler = require('./ManageBooksHandler');
const JekyllHandler = require('./JekyllRequestHandler');
const DefaultHandler = require('./DefaultRequestHandler');



// since workspace is at repository root
const WebRoot = './docs';
ManageBooksHandler.Initialize(WebRoot);
JekyllHandler.Initialize(WebRoot);
DefaultHandler.Initialize(WebRoot);

function HandleRequest(request, response)
{
	var u = url.parse(request.url, true);
	var pathName = u.pathname;

	if (pathName.startsWith("/manage/books/"))
	{
		return ManageBooksHandler.HandleRequest(request, u, response);
	}

	if (request.method != 'GET')
	{
		throw {'status': 400, 'message': 'Only [GET] method is supported at this URL'};
	}

	if (pathName == '/') 
	{
		pathName += 'index.html';
	}
	
	if (pathName.endsWith(".html") || pathName.endsWith(".md"))
	{
		return JekyllHandler.HandleRequest(pathName, response);
	}

	// anything else, return the file
	return DefaultHandler.HandleRequest(pathName, response);
}


var server=http.createServer(function(request, response){
	try
	{
		console.log(' - ' + request.method + ' : ' + request.url);
		HandleRequest(request, response);
	}
	catch (err)
	{
		var msg = "Error Occured:\n\n";
		msg += err.message + "\n";
		msg += err.stack + "\n";

		response.writeHead(404, { 'Content-Type': 'text/plain' });
		response.write(msg);
		response.end();

		console.log(err);
	}
});


server.listen(8000);
console.log('Test server is running at port 8000....');
