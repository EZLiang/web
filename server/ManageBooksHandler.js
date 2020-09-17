const fs = require('fs');

var sWebRoot = "";
var sBookListFile = "";

function Initialize(webRoot)
{
    sWebRoot = webRoot;
    sBookListFile = webRoot + "/books/book-list.js";
}

function HandleRequest(request, response)
{
    if (request.method != 'POST')
	{
		throw {'status': 400, 'message': 'Only [POST] method is supported at this URL'};
    }
    
    var postBody = "";
    request.on('data', function (chunk) {
        postBody += chunk;
    });
    request.on('end', function () {
        // to-do: verify

        try {
            var fd = fs.openSync(sBookListFile, 'w');
            fs.writeSync(fd, 'var books = \n');
            fs.writeSync(fd, postBody);
            fs.writeSync(fd, '\n\nvar isNodeJs = new Function("try {return this===global;}catch(e){return false;}");\n' +
                'if (isNodeJs()) \n{\n  module.exports = books; \n}');
            fs.closeSync(fd);

            console.log('-- book-list updated --');
        
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write('The new list was saved.');
            response.end();
        }
        catch (err) {
            console.log(err);
            
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.write('Failed to save, please check server log.');
            response.end();
        }
    });
    
}



module.exports = 
{
    Initialize, HandleRequest
}

