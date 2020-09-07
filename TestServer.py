import os
import http.server # Our http server handler for http requests
import socketserver # Establish the TCP Socket connections
 
PORT = 8000


class JekyllHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def processHtmlFile(self, dir, filePath):

        htmlPath = dir + filePath
        htmlFile = open(htmlPath, "r")

        htmlLine = htmlFile.readline()
        if htmlLine != "---\n":
            # not Jekyll
            return htmlLine + htmlFile.read()

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

        layoutPath = dir + "/_layouts/" + layoutName + ".html"
        layoutFile = open(layoutPath, "r")
        layoutContent = layoutFile.read()
        layoutFile.close()

        result = layoutContent.replace("{{ content }}", htmlContent)

        for name, value in tags.items():
            result = result.replace("{{ " + name + " }}", value)

        return result



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
            result = self.processHtmlFile(self.directory, path)

            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(result.encode('utf-8'))

        except:
            print("---- failed")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b'Failed')
            #return http.server.SimpleHTTPRequestHandler.do_GET(self)
 
os.chdir("docs")

Handler = JekyllHttpRequestHandler
 
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Http Server Serving at port ", PORT)
    httpd.serve_forever()
