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

        // to-do: beautify



        fs.writeFileSync(sBookListFile, 
            'var books = \n\n' +
            postBody + 
            '\n\nvar isNodeJs = new Function("try {return this===global;}catch(e){return false;}");\n' +
            'if (isNodeJs()) \n{\n  module.exports = books; \n}');

        // client sent it asynchronously, so no need to response
        //response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        //response.write('to-do');
        //response.end();        
    });
    
}



module.exports = 
{
    Initialize, HandleRequest
}

