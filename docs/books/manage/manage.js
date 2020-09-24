
function SaveBookList(newBookList)
{
    var payload = JSON.stringify(newBookList, null, 1);

    var request = new XMLHttpRequest();
    request.open('POST', '/admin/books/readingList', true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.responseType = 'text';

    request.onload = function() {
        alert(request.response);
    };

    request.send(payload);
}

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
        book.description + GetEditLink(groupIndex, bookIndex) +
        '<br clear="all"><br clear="all">';

    return html;
}


function FindBookFieldWithSpecialChar(book)
{
    function FindSpecialCharactar(tag, string)
    {
        if (string === undefined) {
            return '';
        }

        for (let i = 0; i < string.length; i++) {
            var charCode = string.charCodeAt(i);
            if (charCode < 10 || charCode > 126) {
                return tag + '[' + string.charAt(i) + '/' + charCode + '@' + i + ']';
            }
        }

        return '';
    }

    let fieldList = {
        title: book.title,
        author: book.author,
        comment: book.comment,
        description: book.description
    };

    for (const [key,value] of Object.entries(fieldList)) {
        let f = FindSpecialCharactar(key, value);
        if (f != '') {
            return f;
        }
    }

    return '';
}