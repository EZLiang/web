const fs = require('fs');
const showdown = require('showdown');
const yaml = require('js-yaml')

var sDefaultLayouts = { pages: "", posts: ""};
var sWebRoot = "";

function Initialize(webRoot)
{
    sWebRoot = webRoot;

    function LoadConfig()
    {
        try {
            const cfgString = fs.readFileSync(sWebRoot + '/_config.yml', 'utf8');
            const cfg = yaml.safeLoad(cfgString);
            
            if (cfg.defaults === undefined)
                return;

            cfg.defaults.forEach(entry => {
                if (entry.scope === undefined || entry.scope.type === undefined || 
                    entry.values == undefined || entry.values.layout === undefined)
                    return;

                sDefaultLayouts[entry.scope.type] = entry.values.layout;
                console.log('default layout override by config: ' +  entry.scope.type + ' = ' + entry.values.layout);
            });
        }
        catch (e) {
            console.log(e);            
        }
    }

    LoadConfig();
}

function ParseJekyllFrontMatter(fileContent)
{
    // to be returned
    var page = { layout: "", tags: {}, content: fileContent}

    if (!page.content.startsWith("---"))
    {
        // not Jekyll
        return page;
    }

    page.content = page.content.substring(page.content.indexOf("\r\n") + 2);

    while (true) 
    {
        var idx = page.content.indexOf("\r\n");
        if (idx < 0)
        {
            // If line is blank, then hit the EOF
            throw exception("Jekyll ending not found");
        }
        
        var line = page.content.substring(0, idx);
        page.content = page.content.substring(idx + 2);
        if (line.startsWith("---"))
            break;

        var pair = line.split(":");
        var name = pair[0];
        var value = pair[1].trim();

        if (name != name.trim())
            throw exception("Jekyll tag has space surrounded");

        if (name == "layout")
            page.layout = value;
        else
            page.tags[name] = value;
    }

    return page;
}


// load/parse contents and Jekyll front-matter in the order
function LoadAndParseJekyllLayouts(pathName)
{
    // to be returned
    // not include the root layout template, which should have content only
    var result = { pages: [], rootContent: ""};

    var layoutNameList = new Array(); // avoid loop

    while (true)
    {
        var rawContent = fs.readFileSync(sWebRoot + pathName, {encoding:'utf8', flag:'r'});
        var page = ParseJekyllFrontMatter(rawContent);

        if (pathName.endsWith(".md"))
        {
            var md = new showdown.Converter();
            page.content = md.makeHtml(page.content);
        }

        var isPost = pathName.startsWith("/_posts/")

        if (isPost &&  page.tags.category === undefined && page.tags.categories === undefined)
            page.content = "<h1 style='background:red;'>Warning: No category assigned</h1>\n\n" + page.content;
    
        if (page.layout == "")
        {
            if (isPost)
                page.layout = sDefaultLayouts.posts;
            else
                page.layout = sDefaultLayouts.pages;
        }

        if (page.layout == "" || layoutNameList.indexOf(page.layout) >= 0)
        {
            result.rootContent = page.content;
            return result;
        }

        result.pages.unshift({tags: page.tags, content: page.content});
        layoutNameList.push(page.layout);
        pathName = "/_layouts/" + page.layout + ".html";
    }
}


function HandleRequest(pathName, response)
{
    var layoutList = LoadAndParseJekyllLayouts(pathName);
    var result = layoutList.rootContent;

    for (var page of layoutList.pages)
    {
        result = result.replace("{{ content }}", page.content);

        Object.entries(page.tags).forEach( ([key, value]) => {
            var regExReplace = new RegExp("{{ page." + key + " }}", "gi");
            result = result.replace(regExReplace, value);
        });
    }
        
    response.writeHead(200, 
        { 'Content-Type': 'text/html; charset=utf-8' },
        { 'Cache-Control': 'no-store, must-revalidate' },
        { 'Expires': '0'});
    response.write(result);
    response.end();	
}



module.exports = 
{
    Initialize, HandleRequest
}

