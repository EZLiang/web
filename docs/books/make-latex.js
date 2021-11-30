
const BookListFolder = './';
const BookListFile = BookListFolder + 'book-list.js';

class LaTeXEscaper
{
    static Escaper = /(&(#39|ndash|ldquo|rdquo|ouml|auml);|&radic;-1|<(ul|li|em|\/em|\/li|\/ul|br)>|                    )/g;

    static Escapes = {
        '^': '\\^',
        '&#39;': '\'',
        '&ndash;': '-',
        '&ldquo;': '``',
        '&rdquo;': '\'\'',
        '&radic;-1': '$\\sqrt{-1}$',
        '&ouml;': '\\"{o}',
        '&auml;': '\\"{a}',
        '<ul>': '\\begin{itemize}',
        '</ul>': '\\end{itemize}',
        '<li>': '\\item ',
        '</li>': '',
        '<em>': '\\textit{',
        '</em>': '}',
        '<br>': '\\newline',
        '                    ': ' '
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

    FormatBookImage(book)
    {
        this.mResult += 
            "\\begin{minipage}[t]{0.15\\textwidth}\n" +
            "\\strut\\vspace*{-\\baselineskip}\\newline\n" +
            "\\includegraphics[width=1.0in]{" + book.image + "}\n" +
            "\\end{minipage}\n";
    }
    FormatBookDescription(book)
    {
        this.mResult += "\\begin{minipage}[t]{0.83\\textwidth}\n" +
            "\\textbf{" + LaTeXEscaper.Escape(book.title) + "}\\par\n" +
            "\\textit{" + LaTeXEscaper.Escape(book.author) + "}\\par\n" +
            LaTeXEscaper.Escape(book.description) + "\n" +
            "\\end{minipage}\n";
    }

    FormatBook(book, index)
    {
        if (index > 0)
            this.mResult += "\n\\strut\\vspace*{-\\baselineskip}\\newline\n" +
                "\\hdashrule[0ex]{\\textwidth}{0.5pt}{1mm 3mm}\n" +
                "\\strut\\vspace*{-\\baselineskip}\\newline\n\n";

        this.mResult += "\\begin{minipage}{\\textwidth}\n";

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
    }

    FormatBookGroup(bookGroup, index)
    {
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
\\definecolor{sectionColor}{rgb}{0,0.1,1}
\\usepackage{sectsty}
\\subsectionfont{\\color{sectionColor}}
\\usepackage{dashrule}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,linkcolor={blue!50!black},urlcolor=green,citecolor=red}
\\setlength{\\parindent}{0pt}
\\setlength\\intextsep{0pt}
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
        
        //gen.FormatBookGroup(books[0], 0);
        books.forEach(gen.FormatBookGroup, gen);

        gen.mResult += DocTail;
        return gen.mResult;
    }
}


var isNodeJs = new Function("try {return this===global;}catch(e){return false;}");

if (isNodeJs())
{
    //clear();

    const BookImageFolder = BookListFolder + 'images/';

    const bookList = require(BookListFile);
    var texSrc = LatexGenerator.Generate(bookList, BookImageFolder);

    const clipboardy = require('clipboardy');
    clipboardy.writeSync(texSrc);

    console.log("Content was copied to clipboard:");
    console.log(texSrc.substring(0, 100) + "......");

    const TexOutputFile = "books.tex";

    var fs = require('fs');
    fs.writeFile(TexOutputFile, texSrc, function (err) 
    {
        if (err) 
        {
            return console.log(err);
        }
        console.log(TexOutputFile + " was saved!");
    });

    var exec = require('child_process').execFile;
    var PdfLaTex = function()
    {
        exec('pdflatex.exe', ["-synctex=1", "-interaction=nonstopmode", TexOutputFile], function(err, data) 
        {  
            if (err)
            {
                return console.log(err);
            }            
            console.log("PdfLaTex executed." + data.toString());      
        })                 
    };  

    PdfLaTex();
}

// Remove from require cache
function clear() {
    delete require.cache[require.resolve(BookListFile)]
}


