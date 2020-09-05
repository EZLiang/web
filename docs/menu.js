
function GenerateTopNavigationBar()
{
    var WebSiteRoot = 'http://evin.ezget.info/';
    WebSiteRoot = 'file:///C:/src/ezLiang/web/docs/';
    
    var bookGroupSubMenu = ''    
    for (var index = 0; index < books.length; index++)
    {
        bookGroupSubMenu += '            <a href="' + WebSiteRoot + 'books/books.html?group=' + index + '">' + books[index].group + '</a>\n';
    }

    document.write(`
      <div class="topNavBar">
        <a href="` + WebSiteRoot + `">Home</a>
        <div class="dropDown">
          <a href="` + WebSiteRoot + `books/index.html" class="dropButton">Reading-List</a>
          <div class="dropDown-content">\n`
          + bookGroupSubMenu + `
          </div>
        </div> 
      </div>`);  
}

