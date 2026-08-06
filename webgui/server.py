#!/usr/bin/env python3
"""Serve the self-contained FabricBOM FortiFlex plugin for local preview."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
PORT = 8000


class StaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    server = ThreadingHTTPServer(("localhost", PORT), StaticHandler)
    print(f"FortiFlex FabricBOM plugin preview running at http://localhost:{PORT}")
    server.serve_forever()
