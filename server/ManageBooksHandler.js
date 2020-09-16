const fs = require('fs');

var sWebRoot = "";

function Initialize(webRoot)
{
    sWebRoot = webRoot;
}

function HandleRequest(request, url, response)
{
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.write('to-do');
    response.end();
}



module.exports = 
{
    Initialize, HandleRequest
}

