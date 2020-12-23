
class BooksSaver
{    
    static _instance = null;
    static _autoSaveInterval = 1000 * 60 * 5;

    _bookList = null;
    _saveButton = null;
    _colorNoChange = null;
    _colorChanged = 'green';
    _colorSaveError = 'yellow';

    static Initialize(bookList, saveButtonId) {
        BooksSaver._instance = new BooksSaver(bookList, saveButtonId);
        setInterval( () => {
            BooksSaver._instance._OnSave();
        }, BooksSaver._autoSaveInterval);
    }

    constructor(bookList, saveButtonId) {
        this._bookList = bookList;
        this._saveButton = document.getElementById(saveButtonId);
        this._saveButton.onclick = this._OnSave;
        this._colorNoChange = this._saveButton.style.backgroundColor;

        window.onbeforeunload = () => {
            if (this._saveButton.style.backgroundColor != this._colorNoChange) {
                return 'The changes have not been saved yet, are you sure to discard the chagnes?';
            }
            return undefined;
        };
    }

    static OnChanged() {
        BooksSaver._instance._saveButton.style.backgroundColor = BooksSaver._instance._colorChanged;
    }

    _OnSave()
    {
        // this == button

        if (BooksSaver._instance._saveButton.style.backgroundColor == BooksSaver._instance._colorNoChange) {
            return;
        } 

        var payload = JSON.stringify(BooksSaver._instance._bookList, null, 1);

        var request = new XMLHttpRequest();
        request.open('POST', '/admin/books/readingList', true);
        request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        request.responseType = 'text';

        request.onload = function() {
            // this == XMLHttpRequest
            if (request.status == 200) {
                BooksSaver._instance._saveButton.style.backgroundColor = BooksSaver._instance._colorNoChange;
            }
            else {
                BooksSaver._instance._saveButton.style.backgroundColor = BooksSaver._instance._colorSaveError;
                alert(request.status + '/' + request.statusText + ': ' + request.responseText);
            }
        };

        request.send(payload);
    }
};

function GetEditLink(groupIndex, bookIndex)
{
    if (groupIndex >= 0 && bookIndex >= 0) {
        return ' <a href="/books/manage/books.html?group=' + groupIndex + '&book=' + bookIndex + '">&#x270E;</a>';
    }

    return '';
}

// when group/book indexes are valid, add a link to edit book
function FormatBook(book, groupIndex = -1, bookIndex = -1)
{
    let html = '';
    if (book.image === undefined || book.image == '') {
        html = '<strong style="color:red;">{No Image Selected}</strong><br>';
    }
    else {
        html = '<img align="left" style="width: 8rem; padding: 0.5rem;" src="../images/' + book.image + '">';
    }


    html +=
        '<strong>' + book.title + '</strong><br>' +
        'Author(s): <i>' + book.author + '</i><br>' +
    
        ((book.note == undefined || book.note == '') ? '' : 'Note: ' + book.note + '<br>') +

        book.description + GetEditLink(groupIndex, bookIndex) +
        '<br clear="all"><br clear="all">';

    return html;
}


function FindBookFieldWithSpecialChar(book)
{
    function FindSpecialCharactar(string)
    {
        let result = [];

        if (string === undefined) {
            return result;
        }


        for (let i = 0; i < string.length; i++) {
            var charCode = string.charCodeAt(i);
            if (charCode < 10 || charCode > 126) {
                result.push('[' + string.charAt(i) + '/' + charCode + '@' + i + ']');
            }
        }

        return result;
    }

    let fieldList = {
        title: book.title,
        author: book.author,
        note: book.note,
        description: book.description
    };

    let result = {};

    for (const [key,value] of Object.entries(fieldList)) {
        let f = FindSpecialCharactar(value);
        if (f.length > 0) {
            result[key] = f.join(',');
        }
    }

    return result;
}