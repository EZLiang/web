
function SaveBookList(newBookList)
{
    var payload = JSON.stringify(newBookList, null, 1);

    var request = new XMLHttpRequest();
    request.open('POST', '/admin/books/newList', true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.responseType = 'text';

    request.onload = function() {
        alert(request.response);
    };

    request.send(payload);
}

// when group/book indexes are valid, add a link to edit book
function FormatBook(book, groupIndex = -1, bookIndex = -1)
{
    var bookLink = '';
    if (groupIndex >= 0 && bookIndex >= 0) {
        bookLink = '&nbsp; <a href="/books/manage/books.html?group=' + groupIndex + '&book=' + bookIndex + '"> &#x270E; </a>';
    }

    var result = '<img align="left" style="width: 8rem; padding: 0.5rem;" src="../images/' + book.image + '">' +
        '<strong>' + book.title + '</strong><br>' +
        'Author(s): <i>' + book.author + '</i><br>' +
        book.description + bookLink +
        '<br clear="all">';

    return result;
}
