import os
import http.server # Our http server handler for http requests
import socketserver # Establish the TCP Socket connections
 
PORT = 8000


class JekyllHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def processJekyll(self, dir, filePath):
        path = dir + filePath
        file = open(path, "r")

        # to-do:
        lines = file.readlines()
        file.seek(0, os.SEEK_SET)
        content = file.read()
        file.close()

        # to-do: improve this
        layoutLine = lines[1]
        layoutIndex = layoutLine.find("layout:")
        if layoutIndex != 0:
            return content
        
        layoutIndex = len("layout:")
        layoutName = layoutLine[layoutIndex:]
        layoutName = layoutName.strip().rstrip("\n")
        layoutPath = dir + "/_layouts/" + layoutName + ".html"
        layoutFile = open(layoutPath, "r")
        layoutContent = layoutFile.read()
        layoutFile.close()

        result = layoutContent.replace("{{ content }}", content)
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
            result = self.processJekyll(self.directory, path)

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
