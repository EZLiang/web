const fs = require("fs");

class LaTeXEscaper
{
    static Escaper = /(&(#39|auml|ldquo|oacute|ouml|ndash|rdquo);|&radic;-1|<(br|em|\/em|li|\/li|ul|\/ul)>|                    )/g;

    static Escapes = {
        '&#39;': '\'',
        '&auml;': '\\"{a}',
        '&ldquo;': '``',
        '&ndash;': '-',
        '&ouml;': '\\"{o}',
        '&oacute;': 'ó',
        '&radic;-1': '$\\sqrt{-1}$',
        '&rdquo;': '\'\'',
        '<br>': '\\newline ',
        '<em>': '\\textit{',
        '</em>': '}',
        '<li>': '\\item ',
        '</li>': '',
        '<ul>': '\\begin{itemize}',
        '</ul>': '\\end{itemize}'
    }

    // Escape a string for HTML interpolation.
    static Escape(string) 
    {
        return ('' + string).replace(LaTeXEscaper.Escaper, function(match) 
        {
            return LaTeXEscaper.Escapes[match];
        }).replace(/&/g, '\\&');
    };
}

class LatexGenerator
{
    mResult = "";

    mCounter = 0;

    FormatBookImage(book)
    {
        var imgEntry = (book.image == "") ? 
            "" :
            "\\includegraphics[width=1.0in]{" + book.image + "}\n";

        this.mResult += 
            "\\begin{minipage}[t]{0.15\\textwidth}\n" +
            "\\strut\\vspace*{-\\baselineskip}\\newline\n" +
            imgEntry +
            "\\end{minipage}\n";
    }
    FormatBookDescription(book)
    {
        this.mResult += "\\begin{minipage}[t]{0.83\\textwidth}\n" +
            "\\textbf{" + LaTeXEscaper.Escape(book.title) + "}\\par\n" +
            "\\textit{" + LaTeXEscaper.Escape(book.author) + "}\\par\n";

        if (book.note != undefined && book.note != "") {
            this.mResult += "(Note: " + LaTeXEscaper.Escape(book.note) + ")\\par\n";
        }

        this.mResult += LaTeXEscaper.Escape(book.description) + "\n" +
            "\\end{minipage}\n";
    }

    FormatBook(book, index)
    {
        if (index > 0)
            this.mResult += "\n\\strut\\vspace*{-\\baselineskip}\\newline\n" +
                "\\hdashrule[0ex]{\\textwidth}{0.5pt}{1mm 3mm}\n" +
                "\\strut\\vspace*{-\\baselineskip}\\newline\n\n";

        this.mResult += "\\hypertarget{book-" + this.mCounter + "}{}\\begin{minipage}{\\textwidth}\n";

        if (index%2 == 0)
        {
            this.FormatBookImage(book);
            this.mResult += "\\hfill\n";
            this.FormatBookDescription(book);        
        }
        else
        {
            this.FormatBookDescription(book);
            this.mResult += "\\hfill\n";
            this.FormatBookImage(book);
        }

        this.mResult += "\\end{minipage}\n";
        this.mCounter++;
    }

    FormatBookGroup(bookGroup, index)
    {
        if (bookGroup.hidden == true) {
            return;
        }

        if (index != 0) {
            this.mResult += "\n\\newpage\n";
        }
        this.mResult += 
            "\\phantomsection\n" +
            "\\addcontentsline{toc}{subsection}{" + bookGroup.group + "}\n" +
            "\\subsection*{" + bookGroup.group + "}\n" +            
            "\\hdashrule[2ex]{\\textwidth}{0.5pt}{}\n\n";

        bookGroup.list.forEach(this.FormatBook, this);
    }

    FormatBookIndex(book)
    {
        this.mResult += "\\item \\hyperlink{book-" + this.mCounter + "}{" +
            LaTeXEscaper.Escape(book.title) + "}\n";
        this.mCounter++;
    }

    FormatIndexGroup(bookGroup)
    {
        if (bookGroup.hidden == true) {
            return;
        }

        this.mResult += "\\subsubsection*{" + bookGroup.group + "}\n\\begin{enumerate}\n";
        bookGroup.list.forEach(this.FormatBookIndex, this);
        this.mResult += "\\end{enumerate}\n\n";
    }

    static Generate(books, imgRoot)
    {
        imgRoot = imgRoot.replace(/\\/g, '/');
        if (imgRoot.slice(-1) != '/')
        {
            imgRoot += '/';
        }

        const DocHead = 
`\\documentclass[letterpaper]{article}
\\usepackage[top=1.25in, bottom=0.75in, left=1in, right=1in]{geometry}
\\usepackage{xcolor}
\\definecolor{sectionColor}{rgb}{0,0.1,0.5}
\\usepackage{sectsty}
\\subsectionfont{\\color{sectionColor}}
\\usepackage{dashrule}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\definecolor{linkColor}{rgb}{0,0,0.25}
\\hypersetup{colorlinks=true,linkcolor=linkColor,urlcolor=green,citecolor=red}
\\setlength{\\parindent}{0pt}
\\setlength\\intextsep{0pt}
\\usepackage{enumitem}
\\setlist[enumerate]{nosep}
\\graphicspath{{` + imgRoot + `}}

\\begin{document}
\\title{Evin's Reading List}
\\date{}
\\maketitle

\\tableofcontents
\\strut\\vspace*{-\\baselineskip}\\newline\n\n`;

        const DocTail = `\n\\end{document}\n`;

        var gen = new LatexGenerator();
        gen.mResult = DocHead;
        gen.mCounter = 0;
        
        //gen.FormatBookGroup(books[0], 0);
        books.forEach(gen.FormatBookGroup, gen);

        // index
        gen.mResult += '\n\n\\newpage\n\\phantomsection\n\\addcontentsline{toc}{subsection}{Books Index}\n\\subsection*{Books Index}\n\n';

        gen.mCounter = 0;
        books.forEach(gen.FormatIndexGroup, gen);

        gen.mResult += DocTail;
        return gen.mResult;
    }
}


function GenerateLatex(books, imgRoot, latexFile)
{
    let promise = new Promise((resolve, reject) => {        
        const latex = LatexGenerator.Generate(books, imgRoot);
        fs.writeFileSync(latexFile, latex);
        resolve(latex);
    });

    return promise;
}

class PdfTeXLog
{
    _LatexErrors = [];
    _logContent = "";

    _ReadLine()
    {
        if (this._logContent == "") {
            return false;
        }
        var result = this._logContent.substring(0, this._logContent.indexOf("\n"));
        this._logContent = this._logContent.substring(this._logContent.indexOf("\n") + 1);
        return result;
    }

    _ParseLog()
    {
        while (true) {
            let line = this._ReadLine();
            if (line === false) {
                return;
            }
            if (line.startsWith("!")) {
                for (var nextLine = this._ReadLine(); !nextLine.startsWith("l."); nextLine = this._ReadLine()) {}

                this._LatexErrors.push({error: line, details: nextLine});
            }
        }
    }

    static ParseLog(logContent)
    {
        var parse = new PdfTeXLog();
        parse._logContent = logContent;
        parse._ParseLog();
        return parse._LatexErrors;
    }
}

function GeneratePdf(latexFile, outputDir)
{
    const args = [
        "-synctex=1", 
        "-interaction=nonstopmode", 
        "-output-directory=" + outputDir,
        latexFile
    ];

    let promise = new Promise((resolve, reject) => {
        const execFile = require('child_process').execFile;
        const child = execFile('pdflatex.exe', args, (error, stdout, stderr) => {
            if (error) {
                console.error('error', error);
                console.error('stderr', stderr);
                let e = PdfTeXLog.ParseLog(fs.readFileSync(outputDir + "\\ReadingList.log", "utf-8"));
                reject(e);
            }

            resolve();
        });
    });

    return promise;
}

module.exports = {
    GenerateLatex,
    GeneratePdf
}

// below: local run for testing

// relative to workspace root
//#region 
const Cwd = process.cwd() + '\\';
const BookListFile = Cwd + 'docs\\books\\book-list.js';
const BookImageFolder = Cwd + 'docs\\books\\images\\';
const OutputFolder = Cwd + 'tmp\\';
const LatexFile = OutputFolder + 'ReadingList.tex';
//#endregion


if (process.argv.length > 2)
{
    switch (process.argv[2])
    {
        case 'latex':
        {    
            const bookList = require(BookListFile);
            let promise = GenerateLatex(bookList, BookImageFolder, LatexFile);
            promise.then( texSrc => console.log(texSrc.substr(0, 200)));
            break;
        }

        case 'pdf':
        {
            let promise = GeneratePdf(LatexFile, OutputFolder);
            promise
            .then(console.log('returned from GeneratePdf'))
            .catch(errors => console.log(JSON.stringify(errors,null,2)));

            break;
        }
    }
}

