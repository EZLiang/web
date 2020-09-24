const http = require('http');
const url = require('url');

const dispatcherAdminBooks = require('./DispatcherAdminBooks');
const dispatcherJekyllFiles = require('./DispatcherJekyllFiles');
const dispatcherDefaultFiles = require('./DispatcherDefaultFiles');



// since workspace is at repository root
const WebRoot = './docs';
dispatcherAdminBooks.Initialize(WebRoot);
dispatcherJekyllFiles.Initialize(WebRoot);
dispatcherDefaultFiles.Initialize(WebRoot);

function DispatchHttpRequest(request, response)
{
	var pathName = url.parse(request.url, false).pathname;

	if (pathName.startsWith("/admin/books"))
	{
		return dispatcherAdminBooks.HandleRequest(request, response);
	}

	// none admin operations, only 'GET' is supported
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
		return dispatcherJekyllFiles.HandleRequest(pathName, response);
	}

	// anything else, return the file
	return dispatcherDefaultFiles.HandleRequest(pathName, response);
}


var server=http.createServer(function(request, response){
	try
	{
		console.log(' - ' + request.method + ' : ' + request.url);
        if (! DispatchHttpRequest(request, response)) 
        {            
			response.writeHead(404, { 'Content-Type': 'text/plain' });
			response.write('Bad Request:\n');
			response.write('\n  method:  ' + request.method);
			response.write('\n        path:  ' + request.url);
			response.end();
		}		
	}
	catch (err)
	{
		response.writeHead(500, { 'Content-Type': 'text/plain' });
		response.write(err.message);
		response.end();

		console.log(err);
	}
});


server.listen(8000);
console.log('Test server is running at port 8000....');
