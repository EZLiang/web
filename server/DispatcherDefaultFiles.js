const fs = require('fs');

var sWebRoot = "";

function Initialize(webRoot)
{
    sWebRoot = webRoot;
}

// note: case sensitive
function GetMineTypeByExtention(pathName)
{
    var extension = pathName.slice((pathName.lastIndexOf(".") - 1 >>> 0) + 2);
    switch (extension)
    {
        // omit .html/.md since it is treated as Jekyll file
        case 'css':    return 'text/css';
        case 'ico':	   return 'image/x-icon';
        case 'png':    return 'image/png';
        case 'jpg': 
        case 'jpeg':   return 'image/jpeg';

        default:       return 'application/octet-stream';
    }
}

function GetDirectoryContent(path)
{
    var result = `
        <html><head></head>        
        <body style="font-family: monospce; font-size: 1.2em;">
        <h3>` + path + `</h3>
        <hr><br>
        <a href="..">[..]</a><br>\n`;

    var list = fs.readdirSync(path);
    list.forEach(file => {
        if (fs.lstatSync(path + file).isDirectory())
        {
            // !! ending '/' in href is important !!
            result += '<a href="' + file + '/">[' + file + ']</a><br>';
        }
        else
        {
            result += '<a href="' + file + '">' + file + '</a><br>';
        }
    });

    result += '</html>';
    return result;
}

function HandleRequest(pathName, response)
{
    var path = sWebRoot + pathName;
    var isDirectory = fs.lstatSync(path).isDirectory();
    if (isDirectory)
    {
        if (!path.endsWith('/')) {
            path += '/';
        }
        
        var dirList = GetDirectoryContent(path);

        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.write(dirList);
        response.end();
    }
    else
    {
        response.writeHead(200, { 'Content-Type': GetMineTypeByExtention(pathName) });
        response.write(fs.readFileSync(path));
        response.end();
    }

    return true;
}



module.exports = 
{
    Initialize, HandleRequest
}

