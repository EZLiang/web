function IsTesting()
{
    return (window.location.hostname == '127.0.0.1');
}
function IsShowableBookGroup(bookGroup)
{
    if (bookGroup.group == "To Read") {
      return IsTesting();
    }

    return true;
}

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
          if (IsShowableBookGroup(books[index])) {
            result += '      <a href="/books/books.html?group=' + index + '">' + books[index].group + '</a>\n';
          }
      }

      return result;
    }

    function GetTestMenus()
    {
      if (!IsTesting()) {
        return "";
      }

      return `
        <div id="TestOnly" class="dropDown">
          <span><a id="menu.test" href="/">Test Only</a></span>
          <div class="dropDown-content">
              <a href="/_posts/">Posts</a>
              <a href="/_layouts/">Layouts</a>
              <a href="/assets/">Assets</a>
          </div>
        </div>
        `;
    }

    document.write(`
      <nav>
        <a id="menu.home" href="/">Home</a>
        <div class="dropDown">
          <a id="menu.books" href="/books/index.html">Reading-List</a>
          <div class="dropDown-content">`
            + GetBooksSubMenu() + `
          </div>
        </div>
        <a id="blog" href="/blog/index.html">Blog</a>
        <a id="contact" href="/contact/index.html">Contact</a>
        <a href="http://fractran.ezget.info">FRACTRAN</a>`

          + GetTestMenus() + `

        <div style="float: right; margin:5pt; font-size:16pt; color: gray;">
          Evin Liang
        </div>
      </nav>`);

      SetActiveMenu();
}

