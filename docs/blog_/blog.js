function formatPost(post) {
  var result = "";
  result += "<h2>" + post.title + "</h2>\n";
  if (post.caption != "") {
    result += "<h6>" + post.caption + "</h6>\n";
  }
  if (post.categories.length != 0) {
    result += "<h6><em>In: ";
    for (var i of post.categories) {
      result += "<a href=\"category.html?category=" + i + "\">" + i + "</a>";
    }
    result += "</em></h6>"
  }
  result += "<p>" + post.content + "</p>"
  return result;
}

class search {
  static getIndexByTitle(title) {
    for (var i in posts) {
      if (posts[i].title == title) {
        return i;
      }
    }
    return NaN;
  }
}

function formatBlurb(post) {
  var content = "<li><a href=\"index.html?postid=" + search.getIndexByTitle(post.title) + "\">" + post.title;
  if (post.caption != "") {
    content += " - " + post.caption;
  }
  content += "</a></li>"
  return content;
}
