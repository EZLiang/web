const fs = require('fs');
const url = require('url');
const latexPdf = require('./Books-MakeLatexPdf');

"use strict";

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
    sImgPickerPs = sCwd + "server\\Books-PickupImage.ps1";
}


class AdminImage
{
    static Delete(request, response, url, paths)
    {
        if (paths.length == 0) {
            throw Error("missing image name");
        }

        let imgName = paths[0];
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
            let snList = [];

            // find available file number
            let regName = new RegExp('books-\\d+\.*', 'i');
            let regNumber = new RegExp('\\d+');
            let onDiskImgList = fs.readdirSync(sImgFolder);
            onDiskImgList.forEach(name => {
                if (regName.test(name)) {
                    let n = regNumber.exec(name)[0];
                    snList.push(n);
                }
            });

            let sn = -1;
            snList.sort();
            for (let n = 0; n < snList.length; n++) {
                let i = parseInt(snList[n]);
                if (i != n) {
                    sn = n;
                    break;
                }
            }

            if (sn < 0) {
                // no gap found
                sn = snList.length;
            }

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
        AdminImage._PickUp(response, sImgFolder);
    }
    static PickUpNew(request, response, url, paths)
    {
        AdminImage._PickUp(response, '');
    }

    static NewImage(request, response, url, paths)
    {
        function GetNextAvailableImageName()
        {
            let snList = [];

            let regName = new RegExp('books-\\d+\.*', 'i');
            let regNumber = new RegExp('\\d+');

            let onDiskImgList = fs.readdirSync(sImgFolder);
            onDiskImgList.forEach(name => {
                if (regName.test(name)) {
                    let n = regNumber.exec(name)[0];
                    snList.push(n);
                }
            });

            let sn = -1;
            snList.sort();
            for (let n = 0; n < snList.length; n++) {
                let i = parseInt(snList[n]);
                if (i != n) {
                    sn = n;
                    break;
                }
            }

            if (sn < 0) {
                // no gap found
                sn = snList.length;
            }

            const zeroPad = (num, places) => String(num).padStart(places, '0');
            let newImgFile = 'books-' + zeroPad(sn, 5);
            return newImgFile;
        }
         
        var blobparts = []
        request.on('data', function (chunk) {
            blobparts.push(chunk);
        });
        request.on('end', function () {
            let imgFileName = GetNextAvailableImageName();
            var extension;
            switch (request.headers['content-type']) {
                case 'image/png':
                    extension = '.png'
                    break;
                case 'image/jpg':
                case 'image/jpeg':
                    extension = '.jpg'
                    break
                default:
                    response.writeHead(400);
                    response.end()
                    return;
            }
            imgFileName += extension;
            let newImgPath = sImgFolder + imgFileName;

            var fd = fs.openSync(newImgPath, 'w');
            blobparts.forEach(blob => fs.writeSync(fd, blob));
            fs.closeSync(fd);

            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write(imgFileName);
            response.end();
        });
    }
}   // AdminImage


class AdminReadingList
{
    _LastPdfErrors = null;

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

    _IsEngineBusy = false;
    static async _WaitEngineAvailable() {
        const WaitTimeOutMs = 20 * 1000;
        const WaitIntervalMs = 250;
        const WaitCount = WaitTimeOutMs / WaitIntervalMs;
        
        function Sleep() {
            return new Promise(resolve => setTimeout(resolve, WaitIntervalMs));
        }

        for (let i = 1; AdminReadingList._IsEngineBusy && i <= WaitCount; i++)
        {
            if (i%4 == 0) {
                console.log('waiting LaTex/Pdf engine...');
            }

            await Sleep();
        }

        if (AdminReadingList._IsEngineBusy) {
            throw "Waiting for LaTeX/Pdf engine timed out";
        }
    }

    static async MakeLatex(request, response, url, paths)
    {
        const bookList = require(sBookListFile);

        await AdminReadingList._WaitEngineAvailable();
        AdminReadingList._IsEngineBusy = true;
        let promiseLatex = latexPdf.GenerateLatex(bookList, sImgFolder, sLatexFile);

        let pdfConvertStarted = false;

        promiseLatex.then( result => {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write(result);
            response.end();

            // async generate pdf
            let promisePdf = latexPdf.GeneratePdf(sLatexFile, sTmpFolder);
            pdfConvertStarted = true;

            promisePdf.then( () => {
                AdminReadingList._LastPdfErrors = null;
            }).catch(error => {
                AdminReadingList._LastPdfErrors = error;
            }).finally(() => {
                AdminReadingList._IsEngineBusy = false;
            });
        }).finally( () => {
            if (!pdfConvertStarted) {
                AdminReadingList._IsEngineBusy = false;
            }
        });
    }

    static async GetPdf(request, response, url, paths)
    {
        await AdminReadingList._WaitEngineAvailable();

        if (AdminReadingList._LastPdfErrors == null) {
            let pdf = fs.readFileSync(sPdfFile);    // read as binary, but, 'binary' option means latin1
            
            response.writeHead(200, { 'Content-Type': 'application/pdf' });
            response.write(pdf);
            response.end();
        }
        else {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.write(JSON.stringify(AdminReadingList._LastPdfErrors, null, 2));
            response.end();
        }
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
                }, {
                    path: 'new',
                    method: 'POST',
                    action: AdminImage.NewImage
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

        if ( entry.children === undefined || paths.length == 1) {
            return null;
        }

        return this._GetActionFromTable(method, paths.slice(1), entry.children);
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

