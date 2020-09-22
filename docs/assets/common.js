"use strict";

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

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(window.location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function getURLParameterAsInt(name, defaultValue) {
    var x = getURLParameter(name);
    if (x != null) {
      x = parseInt(x);
      if (x != NaN) {
        return x;
      }
    }

    return defaultValue;
}