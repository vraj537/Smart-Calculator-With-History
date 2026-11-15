import os
import subprocess
from http.server import SimpleHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

os.chdir(os.path.dirname(os.path.abspath(__file__)))

exe = os.path.abspath("backend.exe" if os.name == "nt" else "backend")
if not os.path.exists(exe):
    subprocess.run(["gcc", "backend.c", "-o", "backend"], check=True)

backend = subprocess.Popen([exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1)

def ask_backend(cmd):
    backend.stdin.write(cmd + "\n")
    backend.stdin.flush()
    lines = []
    while True:
        line = backend.stdout.readline()
        if line == "" or line.strip() == "END":
            break
        lines.append(line.strip())
    return "\n".join(lines)

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/api":
            cmd = parse_qs(url.query).get("cmd", [""])[0]
            cmd = cmd.replace("\n", " ").replace("\r", " ")
            reply = ask_backend(cmd)
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(reply.encode("utf-8"))
        else:
            SimpleHTTPRequestHandler.do_GET(self)

    def log_message(self, format, *args):
        pass

print("Open http://localhost:8000 in the browser")
HTTPServer(("localhost", 8000), Handler).serve_forever()
