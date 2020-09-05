
function GenerateTopNavigationBar(dotPath, page)
{
    var WebSiteRoot = 'http://evin.ezget.info/';
    WebSiteRoot = 'file:///C:/src/ezLiang/web/docs/';
    
    var bookGroupSubMenu = ''    
    for (var index = 0; index < books.length; index++)
    {
        bookGroupSubMenu += '      <a href="' + dotPath + 'books/books.html?group=' + index + '">' + books[index].group + '</a>\n';
    }

    var HomeClass = (page == "Home") ? ' class="active" ' : '';
    var bookClass = (page == "Reading-List") ? ' class="active" ' : '';
    document.write(`
      <div class="topNavBar">
        <a ` + HomeClass + ` href="` + dotPath + `">Home</a>
        <div class="dropDown">
          <a ` + bookClass + ` href="` + dotPath + `books/index.html" class="dropButton">Reading-List</a>
          <div class="dropDown-content">`
            + bookGroupSubMenu +`
          </div>
        </div>

        <div style="float: right; margin:5pt; font-size:16pt; color: yellow;">
          Evin Liang
        </div>
      </div>`);  
}

