#!/usr/bin/env python3
import os
import sys
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = int(os.environ.get("PORT", 5000))
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_FILE = os.path.join(DATA_DIR, "database.json")
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
CSS_DIR = os.path.join(PROJECT_ROOT, "css")
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

def load_db():
    if not os.path.exists(DB_FILE):
        default_db = {
            "version": "2.8.1",
            "downloadUrl": "https://github.com/datphalm/idle-game/releases/latest",
            "players": [
                {"id": "p_1", "name": "Độc Cô Cầu Bại", "heroId": "hero_raiden", "constellation": 6, "level": 88, "stage": 52, "towerFloor": 65, "power": 852000, "lastActive": int(time.time()*1000)},
                {"id": "p_2", "name": "Vô Danh Kiếm Thánh", "heroId": "hero_changli", "constellation": 4, "level": 75, "stage": 45, "towerFloor": 50, "power": 620000, "lastActive": int(time.time()*1000)},
                {"id": "p_3", "name": "Thần Kiếm Tiêu Dao", "heroId": "hero_jiyan", "constellation": 3, "level": 68, "stage": 38, "towerFloor": 42, "power": 480000, "lastActive": int(time.time()*1000)}
            ],
            "logs": []
        }
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(default_db, f, ensure_ascii=False, indent=2)
        return default_db
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"players": [], "logs": []}

def save_db(db):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

MIME_MAP = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".ogv": "video/ogg",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".wasm": "application/wasm",
}

def get_mime(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    return MIME_MAP.get(ext, "application/octet-stream")

def resolve_static_file(rel_path):
    rel_path = rel_path.lstrip("/\\")
    if not rel_path or rel_path == "index.html":
        for cand in [
            os.path.join(STATIC_DIR, "index.html"),
            os.path.join(DIST_DIR, "index.html"),
            os.path.join(PROJECT_ROOT, "index.html")
        ]:
            if os.path.isfile(cand):
                return cand
        return None

    norm = os.path.normpath(rel_path)
    if ".." in norm.split(os.sep):
        return None

    for base in [STATIC_DIR, PROJECT_ROOT, DIST_DIR]:
        cand = os.path.join(base, rel_path)
        if os.path.isfile(cand):
            return cand
    return None

class RequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
        self.send_header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length")
        self.end_headers()

    def _serve_file(self, file_path, is_head=False):
        try:
            total_size = os.path.getsize(file_path)
            mime = get_mime(file_path)
            range_header = self.headers.get("Range")

            if range_header and range_header.startswith("bytes="):
                parts = range_header[6:].split("-")
                start = int(parts[0]) if parts[0] else 0
                end = int(parts[1]) if len(parts) > 1 and parts[1] else total_size - 1
                if end >= total_size:
                    end = total_size - 1

                if start > end or start < 0:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{total_size}")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    return

                length = end - start + 1
                self.send_response(206)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Range", f"bytes {start}-{end}/{total_size}")
                self.send_header("Content-Length", str(length))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length")
                self.end_headers()

                if not is_head:
                    with open(file_path, "rb") as f:
                        f.seek(start)
                        remaining = length
                        while remaining > 0:
                            chunk = f.read(min(65536, remaining))
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                            remaining -= len(chunk)
            else:
                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(total_size))
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length")
                self.end_headers()

                if not is_head:
                    with open(file_path, "rb") as f:
                        while True:
                            chunk = f.read(65536)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
        except Exception:
            pass

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_HEAD(self):
        path = self.path.split("?")[0]
        if path.startswith("/api/"):
            self._set_headers(200)
            return

        target_file = resolve_static_file(path)
        if target_file:
            self._serve_file(target_file, is_head=True)
        else:
            self._set_headers(404, "text/plain")

    def do_GET(self):
        db = load_db()
        path = self.path.split("?")[0]

        if path == "/api/leaderboard":
            self._set_headers(200)
            players = sorted(db.get("players", []), key=lambda p: (p.get("level", 0), p.get("power", 0)), reverse=True)
            self.wfile.write(json.dumps(players[:100], ensure_ascii=False).encode("utf-8"))

        elif path == "/api/admin/logs":
            self._set_headers(200)
            logs = db.get("logs", [])
            self.wfile.write(json.dumps(logs[:150], ensure_ascii=False).encode("utf-8"))

        elif path == "/api/version":
            self._set_headers(200)
            v_data = {}
            for possible_v in [
                os.path.join(PROJECT_ROOT, "version.json"),
                os.path.join(STATIC_DIR, "version.json"),
                os.path.join(DIST_DIR, "version.json")
            ]:
                if os.path.exists(possible_v):
                    try:
                        with open(possible_v, "r", encoding="utf-8") as vf:
                            v_data = json.load(vf)
                            break
                    except Exception:
                        pass

            if not v_data.get("version"):
                v_data["version"] = db.get("version", "2.8.1")
            if not v_data.get("title"):
                v_data["title"] = "Bản Cập Nhật v" + str(v_data["version"])
            if not v_data.get("changelog"):
                v_data["changelog"] = db.get("changelog", [])

            v_data["bundleUrl"] = "/api/patch/bundle"
            v_data["cssUrl"] = "/api/patch/css"
            v_data["htmlUrl"] = "/api/patch/html"
            v_data["downloadUrl"] = v_data.get("downloadUrl") or db.get("downloadUrl", "https://github.com/datphalm/idle-game/releases/latest")
            self.wfile.write(json.dumps(v_data, ensure_ascii=False).encode("utf-8"))

        elif path == "/api/patch/bundle":
            bundle_file = os.path.join(STATIC_DIR, "game.bundle.js")
            if os.path.exists(bundle_file):
                self._set_headers(200, "application/javascript; charset=utf-8")
                with open(bundle_file, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self._set_headers(404, "text/plain; charset=utf-8")
                self.wfile.write(b"Bundle not found on server")

        elif path == "/api/patch/css":
            css_file = os.path.join(CSS_DIR, "style.css")
            if not os.path.exists(css_file):
                css_file = os.path.join(STATIC_DIR, "style.css")
            if os.path.exists(css_file):
                self._set_headers(200, "text/css; charset=utf-8")
                with open(css_file, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self._set_headers(404, "text/plain; charset=utf-8")
                self.wfile.write(b"CSS not found on server")

        elif path == "/api/patch/html":
            html_file = os.path.join(STATIC_DIR, "index.html")
            if not os.path.exists(html_file):
                html_file = os.path.join(DIST_DIR, "index.html")
            if not os.path.exists(html_file):
                html_file = os.path.join(PROJECT_ROOT, "index.html")
            if os.path.exists(html_file):
                self._set_headers(200, "text/html; charset=utf-8")
                with open(html_file, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self._set_headers(404, "text/plain; charset=utf-8")
                self.wfile.write(b"HTML not found on server")

        elif path.startswith("/api/"):
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "API route not found"}).encode("utf-8"))

        else:
            target_file = resolve_static_file(path)
            if target_file:
                self._serve_file(target_file, is_head=False)
            else:
                self._set_headers(404, "text/plain; charset=utf-8")
                self.wfile.write(b"File not found on server")

    def do_POST(self):
        db = load_db()
        path = self.path.split("?")[0]
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len > 0 else b"{}"

        try:
            data = json.loads(body.decode("utf-8"))
        except Exception:
            data = {}

        if path == "/api/player/sync":
            if data and data.get("name"):
                players = db.get("players", [])
                p_id = data.get("id") or ("player_" + str(int(time.time() * 1000)))
                data["id"] = p_id
                data["lastActive"] = int(time.time() * 1000)
                data["isMe"] = False
                
                known = data.get("knownPlayers", [])
                if isinstance(known, list):
                    for kp in known:
                        if isinstance(kp, dict):
                            k_id = kp.get("id")
                            if k_id and not any(p.get("id") == k_id for p in players):
                                kp["isMe"] = False
                                players.append(kp)

                idx = next((i for i, p in enumerate(players) if p.get("id") == p_id), -1)
                if idx != -1:
                    existing = players[idx]
                    data["level"] = max(existing.get("level", 0), data.get("level", 0))
                    data["power"] = max(existing.get("power", 0), data.get("power", 0))
                    data["stage"] = max(existing.get("stage", 0), data.get("stage", 0))
                    data["towerFloor"] = max(existing.get("towerFloor", 0), data.get("towerFloor", 0))
                    players[idx] = data
                else:
                    players.append(data)

                if "knownPlayers" in data:
                    del data["knownPlayers"]
                
                db["players"] = players
                save_db(db)

                players_sorted = sorted(players, key=lambda p: (p.get("level", 0), p.get("power", 0)), reverse=True)
                self._set_headers(200)
                self.wfile.write(json.dumps(players_sorted[:100], ensure_ascii=False).encode("utf-8"))
                return

        elif path == "/api/admin/log":
            if data:
                logs = db.get("logs", [])
                logs.insert(0, data)
                db["logs"] = logs[:300]
                save_db(db)
                self._set_headers(200)
                self.wfile.write(json.dumps({"status": "logged"}).encode("utf-8"))
                return

        self._set_headers(400)
        self.wfile.write(json.dumps({"error": "invalid_request"}).encode("utf-8"))

def run():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Leaderboard Server listening on port {PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    run()
