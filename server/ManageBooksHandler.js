const fs = require('fs');
const latexPdf = require('./Books-MakeLatexPdf');

// for web
var sWebRoot = "";

// for local process
var sCwd = "";
var sBookListFile = "";
var sTmpFolder = "";
var sImgFolder = "";
var sLatexFile = "";
var sPdfFile = "";

function Initialize(webRoot)
{
    sWebRoot = webRoot;

    sCwd = process.cwd() + '\\';   // should be workspace folder
    sBookListFile = sCwd + "docs\\books\\book-list.js";
    sTmpFolder = sCwd + 'tmp\\';
    sImgFolder = sCwd + 'docs\\books\\images\\'
    sLatexFile = sTmpFolder + 'ReadingList.tex';
    sPdfFile = sTmpFolder + 'ReadingList.pdf';
}

function UpdateBookList(request, response)
{
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

function HandleMakeLatex(response)
{
    const bookList = require(sBookListFile);
    var latex = latexPdf.GenerateLatex(bookList, sImgFolder, sLatexFile);

    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.write(latex);
    response.end();

    // async generate pdf
    latexPdf.GeneratePdf(sLatexFile, sTmpFolder);
}

function HandleMakePdf(response)
{
    // sync call will fail, so let HandleMakeLatex do async call, here just return pdf file
    //latexPdf.GeneratePdf(sLatexFile, sTmpFolder);

    // to-do: wait for pdf ready

    var pdf = fs.readFileSync(sPdfFile);    // read as binary, but, 'binary' option means latin1
    
    response.writeHead(200, { 'Content-Type': 'application/pdf' });
    response.write(pdf);
    response.end();
}

function HandleRequest(request, url, response)
{
    var paths = url.pathname.split('/');
    paths = paths.slice(3); // 1st one is empty string before '/'

    if (paths.length == 0 && request.method == 'POST') {
        return UpdateBookList(request, response);
    }

    if (paths.length == 1 && request.method == 'GET') {
        switch (paths[0])
        {
            case 'ReadingList.tex': return HandleMakeLatex(response);
            case 'ReadingList.pdf': return HandleMakePdf(response);
        }
    }

    throw {'status': 400, 'message': 'Unsupported request'};    
}



module.exports = 
{
    Initialize, HandleRequest
}

