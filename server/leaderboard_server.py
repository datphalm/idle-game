#!/usr/bin/env python3
"""
IDLE RPG - DEDICATED REST BACKEND SERVER
Máy chủ Quản Lý Bảng Xếp Hạng Toàn Cầu, Dữ Liệu Bạn Bè & Nhật Ký Hoạt Động (Activity Logs)
Chạy độc lập bằng Python 3 thuần túy, không cần cài đặt thêm thư viện bên ngoài (Zero Dependencies).
"""

import os
import sys
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

PORT = int(os.environ.get("PORT", 5000))
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_FILE = os.path.join(DATA_DIR, "database.json")

os.makedirs(DATA_DIR, exist_ok=True)

# Khởi tạo Database nếu chưa tồn tại
def load_db():
    if not os.path.exists(DB_FILE):
        default_db = {
            "version": "2.2.0",
            "downloadUrl": "https://github.com/idlerpg/release/releases/latest",
            "changelog": [
                "Khắc phục triệt để lỗi hoàn trả vàng vô tận khi gacha E6 trùng",
                "Bổ sung thanh Bán Nhanh trang bị theo phẩm chất và tối ưu giá bán",
                "Mở tính năng Gacha x1000 và sửa lỗi Auto Gacha dừng đúng phẩm chất ???",
                "Trừ chìa khóa Boss ngay khi vào trận, không hoàn lại dù thắng hay thua",
                "Cải tiến hiệu ứng kết liễu: thanh máu về 0 hoàn chỉnh trước khi chuyển quái",
                "Tối ưu hồi chiêu kỹ năng chạy ngầm mượt mà 60fps và tự động nâng skill",
                "Đồng bộ chuẩn quốc tế Cung Mệnh E0 đến E6 toàn diện"
            ],
            "players": [
                {"id": "p_1", "name": "Độc Cô Cầu Bại", "heroId": "hero_raiden", "constellation": 6, "level": 88, "stage": 52, "towerFloor": 65, "power": 852000, "lastActive": int(time.time()*1000)},
                {"id": "p_2", "name": "Vô Danh Kiếm Thánh", "heroId": "hero_changli", "constellation": 4, "level": 75, "stage": 45, "towerFloor": 50, "power": 620000, "lastActive": int(time.time()*1000)},
                {"id": "p_3", "name": "Thần Kiếm Tiêu Dao", "heroId": "hero_jiyan", "constellation": 3, "level": 68, "stage": 38, "towerFloor": 42, "power": 480000, "lastActive": int(time.time()*1000)}
            ],
            "logs": [
                {"id": 1, "time": int(time.time()*1000), "player": "Độc Cô Cầu Bại", "type": "gacha", "tag": "GACHA", "color": "#d500f9", "message": "Chiêu mộ Raiden Shogun (E6) thành công!"}
            ]
        }
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(default_db, f, ensure_ascii=False, indent=2)
        return default_db
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {"players": [], "logs": []}

def save_db(db):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
CSS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "css")
os.makedirs(STATIC_DIR, exist_ok=True)

class RequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

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
                os.path.join(os.path.dirname(os.path.dirname(__file__)), "version.json"),
                os.path.join(STATIC_DIR, "version.json"),
                os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist", "version.json")
            ]:
                if os.path.exists(possible_v):
                    try:
                        with open(possible_v, "r", encoding="utf-8") as vf:
                            v_data = json.load(vf)
                            break
                    except Exception:
                        pass

            if not v_data.get("version"):
                v_data["version"] = db.get("version", "2.3.0")
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
                html_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist", "index.html")
            if not os.path.exists(html_file):
                html_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "index.html")
            if os.path.exists(html_file):
                self._set_headers(200, "text/html; charset=utf-8")
                with open(html_file, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self._set_headers(404, "text/plain; charset=utf-8")
                self.wfile.write(b"HTML not found on server")

        else:
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok", "message": "Idle RPG Leaderboard Server Online"}).encode("utf-8"))

    def do_POST(self):
        db = load_db()
        path = self.path.split("?")[0]
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len) if content_len > 0 else b"{}"

        try:
            data = json.loads(body.decode("utf-8"))
        except:
            data = {}

        if path == "/api/player/sync":
            if data and data.get("name"):
                players = db.get("players", [])
                p_id = data.get("id") or ("player_" + str(int(time.time() * 1000)))
                data["id"] = p_id
                data["lastActive"] = int(time.time() * 1000)
                data["isMe"] = False
                
                # Khôi phục các đối thủ khác từ knownPlayers nếu server vừa khởi động lại
                known = data.get("knownPlayers", [])
                if isinstance(known, list):
                    for kp in known:
                        if isinstance(kp, dict):
                            k_id = kp.get("id")
                            if k_id and not any(p.get("id") == k_id for p in players):
                                kp["isMe"] = False
                                players.append(kp)

                # Tìm và cập nhật hoặc thêm mới người chơi hiện tại
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

                # Trả về bảng xếp hạng cập nhật (đầy đủ mọi người chơi kể cả offline)
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
    print(f"🚀 [Leaderboard Server] Đang lắng nghe tại cổng {PORT}...")
    print(f"👉 API Leaderboard: http://127.0.0.1:{PORT}/api/leaderboard")
    print(f"👉 API Version Check: http://127.0.0.1:{PORT}/api/version")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng máy chủ an toàn.")

if __name__ == "__main__":
    run()
