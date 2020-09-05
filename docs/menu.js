
function GenerateTopNavigationBar(dotPath)
{
    var WebSiteRoot = 'http://evin.ezget.info/';
    WebSiteRoot = 'file:///C:/src/ezLiang/web/docs/';
    
    var bookGroupSubMenu = ''    
    for (var index = 0; index < books.length; index++)
    {
        bookGroupSubMenu += '            <a href="' + dotPath + 'books/books.html?group=' + index + '">' + books[index].group + '</a>\n';
    }

    document.write(`
      <div class="topNavBar">
        <a href="` + dotPath + `">Home</a>
        <div class="dropDown">
          <a href="` + dotPath + `books/index.html" class="dropButton">Reading-List</a>
          <div class="dropDown-content">\n`
          + bookGroupSubMenu + `
          </div>
        </div> 
      </div>`);  
}

