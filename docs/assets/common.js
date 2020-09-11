
// global variable
var g_SiteRoot = "";

function GetSiteRootAndActiveMenuId()
{
    var siteRoot = '';  // no ending slash
    var activeMenuId = 'home';
    var pathName = "";
    
    if (window.location.protocol == 'file:')
    {
      // only for local test
      const RootEnd = '/web/docs/';
      var href = window.location.href;

      var endAt = href.indexOf(RootEnd);
      endAt += RootEnd.length - 1; // no ending slah

      siteRoot = href.substr(0, endAt);
      pathName = href.substring(endAt);
    }
    else
    {
      siteRoot = window.location.origin;
      pathName = window.location.pathname;
    }

    var pathArray = pathName.split('/');
    if (pathArray.length > 1)
    {
      // - may be empty if pathName is '/'
      // - may be a file, check if it is something with a '.'
      //   so, DO NOT use a top folder with '.' in the name
      if (pathArray[1] != '' && pathArray[1].indexOf('.') < 0)
      {
        activeMenuId = pathArray[1];
      }
    }

    return {siteRoot, activeMenuId};
}

function GenerateTopNavigationBar()
{
    let { siteRoot, activeMenuId } = GetSiteRootAndActiveMenuId();
    g_SiteRoot = siteRoot;

    function GetBooksSubMenu()
    {
      var result = '';
      for (var index = 0; index < books.length; index++)
      {
          result += '      <a href="' + siteRoot + '/books/books.html?group=' + index + '">' + books[index].group + '</a>\n';
      }

      return result;
    }

    document.write(`
      <div class="topNavBar">
        <a id="home" href="` + siteRoot + `/">Home</a>
        <div class="dropDown">
          <a id="books" href="` + siteRoot + `/books/index.html" class="dropButton">Reading-List</a>
          <div class="dropDown-content">`
            + GetBooksSubMenu() + `
          </div>
        </div>
        <a id="blog" href="` + siteRoot + `/blog/index.html">Blog</a>
        <a id="contact" href="` + siteRoot + `/contact/index.html">Contact</a>
        <a href="http://fractran.ezget.info">FRACTRAN</a>

        <div style="float: right; margin:5pt; font-size:16pt; color: yellow;">
          Evin Liang
        </div>
      </div>`);

    document.getElementById(activeMenuId).classList.add('active');
}

