import os
import collections
import markdown
import http.server # Our http server handler for http requests
import socketserver # Establish the TCP Socket connections
 
PORT = 8000

# sync with docs/_config.yml
DefaultPageLayout = "default"
DefaultPostLayout = "post"

class JekyllParser:
    def __init__(self, dir):
        self.dir = dir

    # return {layoutName, tagsDictionary, conent}
    # layoutName empty: not Jekyll aware
    def loadAndParseJekyllFrontMatter(self, filePath):
        # Jekyll, parse the header
        layoutName = ""
        tags = {}

        file = open(self.dir + filePath, "r", encoding='utf-8')
        currentLine = file.readline()
        if not currentLine.startswith("---"):
            # not Jekyll
            return layoutName, tags, currentLine + file.read()

        while True:
            currentLine = file.readline()
            # If line is blank, then you struck the EOF
            if not currentLine :
                raise ValueError("Jekyll ending not found")
            if currentLine.startswith("---"):
                break

            pair = currentLine.split(":")
            name = pair[0]
            value = pair[1].rstrip("\n").strip()

            if name != name.strip():
                raise ValueError("Jekyll tag has space surrounded")

            if name == "layout":
                layoutName = value
            else:
                tags["page."+name] = value

        return layoutName, tags, file.read()



    def processfile(self, filePath):

        resultPage = "" # final result
        layoutNameList = [] # avoid loop
        LayoutPage = collections.namedtuple("LayoutPage", "tags content")
        layoutList = []   # layout page list, not include the root layout template, which should have content only

        # local/parse contents and Jekyll front-matter in the order

        while True:
            layoutName, tags, content = self.loadAndParseJekyllFrontMatter(filePath)

            if filePath.endswith(".md"):
                content = markdown.markdown(content)

            isPost = filePath.startswith("/_posts/")

            if isPost and "page.category" not in tags and "page.categories" not in tags:
                content = "<h1 style='background:red;'>Warning: No category assigned</h1>\n\n" + content
            
            if layoutName == "":
                #if isPost:
                #    layoutName = DefaultPostLayout
                #else:
                #    layoutName = DefaultPageLayout
                resultPage = content
                break

            if layoutName in layoutNameList:
                resultPage = content
                break

            layoutList.insert(0, LayoutPage(tags, content))
            layoutNameList.append(layoutName)
            filePath = "/_layouts/" + layoutName + ".html"
        
        # apply layout(s)
        for page in layoutList:
            resultPage = resultPage.replace("{{ content }}", page.content)

            if page.tags != None:
                for name, value in page.tags.items():
                    resultPage = resultPage.replace("{{ " + name + " }}", value)

        return resultPage



class JekyllHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        try:
            path = self.path
            idx = path.find("?")
            if idx > 0:
                path = path[:idx]
            
            if path == "/":
                path += "index.html"
            elif not path.endswith(".html") and not path.endswith(".md"):
                return http.server.SimpleHTTPRequestHandler.do_GET(self)

            parser = JekyllParser(self.directory)
            result = parser.processfile(path)

            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'no-store, must-revalidate')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(result.encode('utf-8'))

        except Exception as e:
            msg = "Error: " + str(type(e)) + " - " + ','.join(e.args)
            print(msg)
            self.send_response(500)
            self.end_headers()
            self.wfile.write(msg.encode('utf-8'))
            #return http.server.SimpleHTTPRequestHandler.do_GET(self)
 
os.chdir("docs")

Handler = JekyllHttpRequestHandler
 
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Http Server Serving at port ", PORT)
    httpd.serve_forever()
