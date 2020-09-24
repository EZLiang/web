const fs = require('fs');
const url = require('url');
const latexPdf = require('./Books-MakeLatexPdf');

"use stricket";

// for web
var sWebRoot = "";

// for local process
var sCwd = "";
var sBookListFile = "";
var sTmpFolder = "";
var sImgFolder = "";
var sLatexFile = "";
var sPdfFile = "";
var sImgPickerPs = "";

function Initialize(webRoot)
{
    sWebRoot = webRoot;

    sCwd = process.cwd() + '\\';   // should be workspace folder
    sBookListFile = sCwd + "docs\\books\\book-list.js";
    sTmpFolder = sCwd + 'tmp\\';
    sImgFolder = sCwd + 'docs\\books\\images\\'
    sLatexFile = sTmpFolder + 'ReadingList.tex';
    sPdfFile = sTmpFolder + 'ReadingList.pdf';
    sImgPickerPs = sCwd + "server\\PickupImage.ps1";
}


class AdminImage
{
    static Delete(request, response, url, paths)
    {
        if (paths.length != 1) {
            throw Error("missing image name");
        }

        let imgName = paths[1];
        fs.unlinkSync(sImgFolder + imgName);

        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.write(imgName + ' was deleted');
        response.end();
    }

    static GetList(request, response, url, paths)
    {
        let list = fs.readdirSync(sImgFolder);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write(JSON.stringify(list, 1));
        response.end();
    }

    static _PickUp(response, initialFolder)
    {
        function CopyImageFile(imgPath)
        {
            let sn = 0;
            
            // find largest file number
            let regName = new RegExp('books-\\d+\.*', 'i');
            let regNumber = new RegExp('\\d+');
            let onDiskImgList = fs.readdirSync(sImgFolder);
            onDiskImgList.forEach(name => {
                if (regName.test(name)) {
                    let n = parseInt(regNumber.exec(name)[0])
                    if (n > sn) {
                        sn = n;
                    }
                }
            });

            sn++;
            const zeroPad = (num, places) => String(num).padStart(places, '0');
            let newImgFile = zeroPad(sn, 5);
            let imgExtension = imgPath.substring(imgPath.lastIndexOf('.'));
            newImgFile = 'books-' + newImgFile + imgExtension;

            let newImgPath = sImgFolder + newImgFile;
            fs.copyFileSync(imgPath, newImgPath);
            return newImgFile;
        }

        function ProcessPickedUpImage(imgFile, imgPath)
        {
            if (! imgPath.toLowerCase().startsWith(sImgFolder.toLowerCase())) {
                // only make a copy and get a new name if picking from outside of books' image folder
                imgFile = CopyImageFile(imgPath);
            }

            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write(imgFile);
            response.end();
        }

        const execFile = require('child_process').execFile;
        const child = execFile('powershell.exe', [sImgPickerPs, initialFolder], (error, stdout, stderr) => {
            if (error) {
                console.error('stderr', stderr);
                throw error;
            }

            let imgPicker = JSON.parse(stdout);
            if (imgPicker.ImageFile === undefined) {
                response.end();
                return;
            }

            ProcessPickedUpImage(imgPicker.ImageFile, imgPicker.ImagePath);
        });
    }

    static PickUpExisting(request, response, url, paths)
    {
        this._PickUp(response, sImgFolder);
    }
    static PickUpNew(request, response, url, paths)
    {
        this._PickUp(response, '');
    }

}   // Image


class AdminReadingList
{
    static SaveList(request, response, url, paths)
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

    static MakeLatex(request, response, url, paths)
    {
        const bookList = require(sBookListFile);
        var latex = latexPdf.GenerateLatex(bookList, sImgFolder, sLatexFile);

        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.write(latex);
        response.end();

        // async generate pdf
        latexPdf.GeneratePdf(sLatexFile, sTmpFolder);
    }

    static GetPdf(request, response, url, paths)
    {
        // sync call will fail, so let HandleMakeLatex do async call, here just return pdf file
        //latexPdf.GeneratePdf(sLatexFile, sTmpFolder);

        // to-do: wait for pdf ready

        var pdf = fs.readFileSync(sPdfFile);    // read as binary, but, 'binary' option means latin1
        
        response.writeHead(200, { 'Content-Type': 'application/pdf' });
        response.write(pdf);
        response.end();
    }

}   // AdminReadingList



// ------------------- dispatching ---------------- //

class Dispatcher
{
    static _ActionTable = 
    [
        {
            path: 'image',
            method: 'DELETE',
            action: AdminImage.Delete,
            children: [ {
                    path: 'list',
                    method: 'GET',
                    action: AdminImage.GetList
                }, {
                    path: 'picker',
                    method: 'GET',
                    action: AdminImage.PickUpExisting
                }, {
                    path: 'picker',
                    method: 'PUT',
                    action: AdminImage.PickUpNew
                }
            ]
        }, {
            path: 'readingList',
            method: 'POST',
            action: AdminReadingList.SaveList
        }, {
            path: 'readingList.tex',
            method: 'GET',
            action: AdminReadingList.MakeLatex
        },
        {
            path: 'readingList.pdf',
            method: 'GET',
            action: AdminReadingList.GetPdf
        }
    ];

    static _GetActionFromEntry(method, paths, entry)
    {
        if (paths[0] != entry.path) {
            return null;
        }

        if (method == entry.method) {
            return { action: entry.action, paths: paths.slice(1) };
        }

        if ( method.children === undefined || paths.length == 1) {
            return null;
        }

        return this.GetActionFromTable(method, paths.slice(1), method.children);
    }

    static _GetActionFromTable(method, paths, actionTable)
    {
        for (let i = 0; i < actionTable.length; i++) {
            let action = this._GetActionFromEntry(method, paths, actionTable[i]);
            if (action != null) {
                return action;
            }
        }

        return null;
    }

    static GetAction(method, paths)
    {
        return this._GetActionFromTable(method, paths, this._ActionTable);
    }
}

function HandleRequest(request, response)
{

    let url_ = url.parse(request.url, true);
    let paths = url_.pathname.split('/');
    paths = paths.slice(3); // ==> '' / 'admin' / 'books' /...

    if (paths.length == 0) {
        return false;
    }

    let action = Dispatcher.GetAction(request.method, paths);
    if (action != null) {
        action.action(request, response, url_, action.paths);
        return true;    // request was handled
    }

    // false = un-supported request
    return false;
}



module.exports = 
{
    Initialize, HandleRequest
}

