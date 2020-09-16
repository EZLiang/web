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

    var activeMenu = document.getElementById('menu.' + activeMenuName);
    if (activeMenu != null)
      activeMenu.classList.add('active');
}

function _GenerateTopNavigationBar()
{

    return `
      <div id="TestOnly" class="dropDown">
        <span><a id="menu.test" href="/">Test Only</a></span>
        <div class="dropDown-content">
            <a href="/_posts/">Posts</a>
            <a href="/_layouts/">Layouts</a>
            <a href="/assets/">Assets</a>
            <a href="/manage/books/">Manage Books</a>
        </div>
      </div>
      `;
}

