import os
import http.server # Our http server handler for http requests
import socketserver # Establish the TCP Socket connections
 
PORT = 8000

class JekyllParser:
    def __init__(self, dir):
        self.dir = dir

    # return {layoutName, tagsDictionary, conent}
    # layoutName empty: not Jekyll aware
    def loadAndParseJekyllFrontMatter(self, filePath):
        htmlPath = self.dir + filePath
        htmlFile = open(htmlPath, "r")

        htmlLine = htmlFile.readline()
        if htmlLine != "---\n":
            # not Jekyll
            return None, None, htmlLine + htmlFile.read()

        # Jekyll, parse the header
        layoutName = "default"
        tags = {}
        while True:
            htmlLine = htmlFile.readline()
            # If line is blank, then you struck the EOF
            if not htmlLine :
                raise ValueError("Jekyll ending not found")
            if htmlLine == "---\n":
                break

            pair = htmlLine.split(":")
            name = pair[0]
            value = pair[1].rstrip("\n").strip()

            if name != name.strip():
                raise ValueError("Jekyll tag has space surrounded")

            if name == "layout":
                layoutName = value
            else:
                tags[name] = value
                if name == "title":
                    tags["page."+name] = value

        htmlContent = htmlFile.read()
        htmlFile.close()

        return layoutName, tags, htmlContent


    def processHtmlFile(self, filePath):

        layoutContent = ""
        pageList = []
        layoutList = []

        # local/parse contents and Jekyll front-matter in the order
        currentFileName = filePath
        while True:
            layoutName, tags, content = self.loadAndParseJekyllFrontMatter(currentFileName)
            if layoutName == None or layoutName in layoutList:
                layoutContent = content
                break

            pageList.insert(0, [tags, content])
            layoutList.append(layoutName)
            currentFileName = "/_layouts/" + layoutName + ".html"
        
        # apply layout(s)
        for page in pageList:
            tags = page[0]
            content = page[1]

            layoutContent = layoutContent.replace("{{ content }}", content)

            if tags != None:
                for name, value in tags.items():
                    layoutContent = layoutContent.replace("{{ " + name + " }}", value)

        return layoutContent



class JekyllHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        try:
            path = self.path
            idx = path.find("?")
            if idx > 0:
                path = path[:idx]
            
            if path.endswith("/"):
                path += "index.html"
            elif not path.endswith(".html"):
                return http.server.SimpleHTTPRequestHandler.do_GET(self)

            print("---- ", path)
            parser = JekyllParser(self.directory)
            result = parser.processHtmlFile(path)

            self.send_response(200)
            self.send_header('Content-type', 'text/html')
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
