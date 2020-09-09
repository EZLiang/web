
function SetActiveMenu()
{
    var activeMenuName = 'home';

    var pathArray = window.location.pathname.split('/');
    if (pathArray.length > 1) // possible length <= 1 ??
    {
      // - may be empty, if pathname == '/'
      // - may be a file, check if it is something with a '.'
      //   so, DO NOT use a top folder with '.' in the name
      if (pathArray[1] != '' && pathArray[1].indexOf('.') < 0)
      {
        activeMenuName = pathArray[1];
      }
    }

    document.getElementById('menu.' + activeMenuName).classList.add('active');
}

function GenerateTopNavigationBar()
{
    function GetBooksSubMenu()
    {
      var result = '';
      for (var index = 0; index < books.length; index++)
      {
          result += '      <a href="/books/books.html?group=' + index + '">' + books[index].group + '</a>\n';
      }

      return result;
    }

    document.write(`
      <div class="topNavBar">
        <a id="menu.home" href="/">Home</a>
        <div class="dropDown">
          <a id="menu.books" href="/books/index.html" class="dropButton">Reading-List</a>
          <div class="dropDown-content">`
            + GetBooksSubMenu() + `
          </div>
        </div>
        <a id="menu.blog" href="/blog/index.html">Blog</a>
        <a id="menu.contact" href="/contact/index.html">Contact</a>

        <div style="float: right; margin:5pt; font-size:16pt; color: gray;">
          Evin Liang
        </div>
      </div>`);

      SetActiveMenu();
}

