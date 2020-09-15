var fs = require('fs');
var http = require('http');
var url = require('url');

var JekyllHandler = require('./JekyllRequestHandler');


function HandleRequest_admin(request,response)
{

}

// since workspace is at repository root
var WebRoot = './docs';
JekyllHandler.Initialize(WebRoot);

function HandleRequest(request, response)
{
	var u = url.parse(request.url, true);
	var pathName = u.pathname;

	if (pathName.startsWith("/admin"))
	{
		return HandleRequest_admin(request, response);
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

	function GetMineTypeByExtention(pathName)
	{
		if (pathName.endsWith('.css'))	return 'text/css';
		if (pathName.endsWith('.ico'))	return 'image/x-icon';

		return 'text/plain';
	}

	response.writeHead(200, { 'Content-Type': GetMineTypeByExtention(pathName) });
	response.write(fs.readFileSync(WebRoot + pathName));
	response.end();
}


var server=http.createServer(function(request, response){
	try
	{
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
	}
});


server.listen(8000);
console.log('Test server is running at port 8000....');
