const fs = require('fs');
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


function GetImageStatus(response)
{
    // existing img files
    var onDiskImgList = fs.readdirSync(sImgFolder);
    // to-do: filtering if needed

    var booksWithoutImage = [];
    var booksImageMissed = [];
    var referredImgList = [];

    function CheckBookImage(book, groupIndex, bookIndex) {
        if (book.image === undefined || book.image == null || book.image == '') {
            booksWithoutImage.push({group: gi, book: bi});
            return;
        }

        if (! onDiskImgList.includes(book.image)) {
            booksImageMissed.push({group: gi, book: bi});
            return;
        }

        referredImgList.push(book.image);
    }

    const bookList = require(sBookListFile);
    for (var gi = 0; gi < bookList.length; gi++) {
        for (var bi = 0; bi < bookList[gi].list.length; bi++) {
            CheckBookImage(bookList[gi].list[bi], gi, bi);
        }
    }
    
    var imagesNotUsed = [];
    for (var i = 0; i < onDiskImgList.length; i++) {
        if (! referredImgList.includes(onDiskImgList[i])) {
            imagesNotUsed.push(onDiskImgList[i]);
        }
    }

    var result = {
        ImagesNotUsed: imagesNotUsed,
        BooksWithoutImage: booksWithoutImage,
        BooksImageMissed: booksImageMissed
    }
    
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write(JSON.stringify(result, 1));
    response.end();
}


function PickUpImage(response, isGet)
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
        let imgName = zeroPad(sn, 5);
        let imgExtension = imgPath.substring(imgPath.lastIndexOf('.'));
        imgName = 'books-' + imgName + imgExtension;

        let newImgPath = sImgFolder + imgName;
        fs.copyFileSync(imgPath, newImgPath);
        return imgName;
    }

    function ProcessPickedUpImage(imgPath)
    {
        var imgFile = "";

        if (imgPath.toLowerCase().startsWith(sImgFolder.toLowerCase())) {
            imgFile = imgPath.substring(sImgFolder.length);
        }
        else {
            imgFile = CopyImageFile(imgPath);
        }

        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.write(imgFile);
        response.end();
    }

    let initialFolder = '';
    if (isGet) {
        initialFolder = sImgFolder;
    }

    const execFile = require('child_process').execFile;
    const child = execFile('powershell.exe', [sImgPickerPs, initialFolder], (error, stdout, stderr) => {
        if (error) {
            console.error('stderr', stderr);
            throw error;
        }

        let imgPath = stdout;
        if (imgPath.endsWith('\n')) {
            imgPath = imgPath.slice(0, -1);
        }

        if (imgPath == "") {
            response.end();
            return;
        }

        ProcessPickedUpImage(imgPath);
    });
}


function HandleRequest(request, url, response)
{
    var paths = url.pathname.split('/');
    paths = paths.slice(3); // 1st one is empty string before '/'

    if (paths.length > 0) {
        switch (paths[0])
        {
            case 'imagePickUp': 
                if (request.method == 'GET') {
                    return PickUpImage(response, true);
                }
                if (request.method == 'PUT') {
                    return PickUpImage(response, false);
                }
                break;

            case 'imageStatus': 
                if (request.method == 'GET') {
                    return GetImageStatus(response);
                }
                break;

            case 'newList':
                if (request.method == 'POST') {
                    return UpdateBookList(request, response);
                }
                break;

            case 'readingList.pdf': 
                if (request.method == 'GET') {
                    return HandleMakePdf(response);
                }
                break;

            case 'readingList.tex': 
                if (request.method == 'GET') {
                    return HandleMakeLatex(response);
                }
                break;
        }
    }

    throw {'status': 400, 'message': 'Unsupported request'};    
}



module.exports = 
{
    Initialize, HandleRequest
}

