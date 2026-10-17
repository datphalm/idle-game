#!/usr/bin/env python3
"""
IDLE RPG - CODE OBFUSCATION & PRODUCTION BUILD PIPELINE
Đóng gói, làm rối mã nguồn nhiều tầng (Multi-layer Obfuscation), chống sao chép và bảo vệ bản quyền game.
"""

import os
import re
import sys
import json
import shutil
import base64
import random
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

SCRIPT_ORDER = [
    "js/core/config.js",
    "js/core/anticheat.js",
    "js/core/updater.js",
    "js/features/leaderboard.js",
    "js/features/friend_admin.js",
    "js/core/dev_admin.js",
    "js/battle/player.js",
    "js/battle/monster.js",
    "js/features/inventory.js",
    "js/battle/combat.js",
    "js/features/forge.js",
    "js/battle/boss.js",
    "js/features/dungeon.js",
    "js/features/gacha.js",
    "js/features/upgrades.js",
    "js/core/save.js",
    "js/ui/sprites.js",
    "js/ui/cinematics.js",
    "js/ui/ui.js",
    "js/core/main.js"
]

def remove_comments_and_whitespace(js_code: str) -> str:
    # Xóa single line comments nhưng giữ URLs
    js_code = re.sub(r'(?<!:)\/\/.*$', '', js_code, flags=re.MULTILINE)
    # Xóa multi line comments
    js_code = re.sub(r'\/\*[\s\S]*?\*\/', '', js_code)
    # Loại bỏ khoảng trắng thừa ở đầu và cuối dòng
    lines = [line.strip() for line in js_code.splitlines() if line.strip()]
    return "\n".join(lines)

def xor_encrypt(data: bytes, key: int) -> bytes:
    return bytes([b ^ key for b in data])

def build_obfuscated_bundle(base_dir: str, output_path: str):
    print("📦 [1/4] Đang hợp nhất các phân hệ mã nguồn...")
    combined_code = []

    for rel_path in SCRIPT_ORDER:
        full_path = os.path.join(base_dir, rel_path)
        if not os.path.exists(full_path):
            print(f"⚠️ Cảnh báo: Không tìm thấy {rel_path}")
            continue
        with open(full_path, "r", encoding="utf-8") as f:
            code = f.read()
            clean_code = remove_comments_and_whitespace(code)
            combined_code.append(clean_code)

    all_js = ";\n".join(combined_code)

    print("🛡️ [2/4] Đang mã hóa và nhúng các lớp bảo vệ Anti-Tamper / Anti-Debug...")
    xor_key = random.randint(101, 245)
    raw_bytes = all_js.encode("utf-8")
    encrypted_bytes = xor_encrypt(raw_bytes, xor_key)
    b64_str = base64.b64encode(encrypted_bytes).decode("ascii")

    # Tạo wrapper tự giải mã và tự bảo vệ
    loader_template = """/* 
 * IDLE RPG — PROTECTED PRODUCTION BUILD v2.5.0
 * (c) ALL RIGHTS RESERVED. DO NOT DECOMPILE OR MODIFY.
 */
(function(_0xroot) {
    'use strict';

    // Bẫy Anti-Debug / Chống mở DevTools
    var _0xdbg = function() {
        try {
            var _0xcons = (function() { return false; })['constructor']('debugger');
            _0xcons();
        } catch(e) {}
    };
    setInterval(_0xdbg, 4000);

    // Giải mã khối chương trình với XOR Key bí mật
    var _0xkey = __XOR_KEY__;
    var _0xpayload = "__PAYLOAD__";

    function _0xdecode(_0xb64, _0xk) {
        var _0xbin = atob(_0xb64);
        var _0xlen = _0xbin.length;
        var _0xbytes = new Uint8Array(_0xlen);
        for (var _0xi = 0; _0xi < _0xlen; _0xi++) {
            _0xbytes[_0xi] = _0xbin.charCodeAt(_0xi) ^ _0xk;
        }
        var _0xdec = new TextDecoder('utf-8');
        return _0xdec.decode(_0xbytes);
    }

    try {
        var _0xcode = _0xdecode(_0xpayload, _0xkey);
        // Thực thi chương trình trong phạm vi toàn cục thực sự
        var _0xsc = document.createElement('script');
        _0xsc.type = 'text/javascript';
        _0xsc.text = _0xcode;
        (document.head || document.documentElement).appendChild(_0xsc);
        _0xsc.parentNode.removeChild(_0xsc);
    } catch(_0xerr) {
        console.error("Critical integrity violation:", _0xerr);
    }
})(typeof window !== 'undefined' ? window : this);
""".replace("__XOR_KEY__", str(xor_key)).replace("__PAYLOAD__", b64_str)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(loader_template)

    print(f"✅ Đã tạo tệp bundle bảo vệ thành công: {output_path} ({len(loader_template):,} bytes)")

def build_dist_release(base_dir: str):
    dist_dir = os.path.join(base_dir, "dist")
    print(f"🚀 [3/4] Đang đóng gói bản phát hành vào thư mục: {dist_dir}...")

    os.makedirs(dist_dir, exist_ok=True)

    # 1. Tạo bundle obfuscated
    bundle_target = os.path.join(dist_dir, "js", "game.bundle.js")
    build_obfuscated_bundle(base_dir, bundle_target)

    # Đưa bản bundle, css và index.html lên server/static để server Render tự phục vụ Hot-Patch
    server_static = os.path.join(base_dir, "server", "static")
    os.makedirs(server_static, exist_ok=True)
    shutil.copy2(bundle_target, os.path.join(server_static, "game.bundle.js"))
    os.makedirs(os.path.join(base_dir, "js"), exist_ok=True)
    shutil.copy2(bundle_target, os.path.join(base_dir, "js", "game.bundle.js"))
    if os.path.exists(os.path.join(base_dir, "css", "style.css")):
        shutil.copy2(os.path.join(base_dir, "css", "style.css"), os.path.join(server_static, "style.css"))

    # 0. Sao lưu & Đồng bộ người chơi từ máy chủ Cloud trước khi đóng gói
    db_path = os.path.join(base_dir, "server", "data", "database.json")
    try:
        import urllib.request
        req = urllib.request.Request("https://idle-game-ypvy.onrender.com/api/leaderboard", headers={"User-Agent": "IdleRPG-Build"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status == 200:
                remote_players = json.loads(resp.read().decode("utf-8"))
                if os.path.exists(db_path):
                    with open(db_path, "r", encoding="utf-8") as f:
                        db_obj = json.load(f)
                else:
                    db_obj = {"players": []}
                
                local_players = db_obj.get("players", [])
                p_map = {p.get("id"): p for p in local_players if p.get("id")}
                for rp in remote_players:
                    rid = rp.get("id")
                    if rid:
                        if rid in p_map:
                            p_map[rid]["level"] = max(p_map[rid].get("level", 0), rp.get("level", 0))
                            p_map[rid]["power"] = max(p_map[rid].get("power", 0), rp.get("power", 0))
                            p_map[rid]["stage"] = max(p_map[rid].get("stage", 0), rp.get("stage", 0))
                            p_map[rid]["towerFloor"] = max(p_map[rid].get("towerFloor", 0), rp.get("towerFloor", 0))
                            p_map[rid]["lastActive"] = max(p_map[rid].get("lastActive", 0), rp.get("lastActive", 0))
                        else:
                            p_map[rid] = rp
                db_obj["players"] = list(p_map.values())
                os.makedirs(os.path.dirname(db_path), exist_ok=True)
                with open(db_path, "w", encoding="utf-8") as f:
                    json.dump(db_obj, f, ensure_ascii=False, indent=2)
                print(f"📥 Đã đồng bộ & bảo toàn {len(db_obj['players'])} người chơi từ Cloud về máy!")
    except Exception as e:
        pass

    # Đồng bộ version.json
    version_file = os.path.join(base_dir, "version.json")
    if os.path.exists(version_file):
        shutil.copy2(version_file, os.path.join(dist_dir, "version.json"))
        shutil.copy2(version_file, os.path.join(server_static, "version.json"))
        try:
            with open(version_file, "r", encoding="utf-8") as vf:
                v_data = json.load(vf)
            if os.path.exists(db_path):
                with open(db_path, "r", encoding="utf-8") as dbf:
                    db_obj = json.load(dbf)
                db_obj["version"] = v_data.get("version", "2.5.0")
                db_obj["changelog"] = v_data.get("changelog", [])
                with open(db_path, "w", encoding="utf-8") as dbf:
                    json.dump(db_obj, dbf, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ Đồng bộ database.json version: {e}")

    # 2. Copy libs (three.min.js, pixi.min.js...)
    libs_src = os.path.join(base_dir, "js", "libs")
    libs_dst = os.path.join(dist_dir, "js", "libs")
    os.makedirs(libs_dst, exist_ok=True)
    if os.path.exists(libs_src):
        for lib_file in os.listdir(libs_src):
            src_f = os.path.join(libs_src, lib_file)
            if os.path.isfile(src_f):
                shutil.copy2(src_f, os.path.join(libs_dst, lib_file))
                if os.path.exists(server_static):
                    static_libs = os.path.join(server_static, "js", "libs")
                    os.makedirs(static_libs, exist_ok=True)
                    shutil.copy2(src_f, os.path.join(static_libs, lib_file))

    # 3. Minify & Nén bảo vệ toàn bộ CSS (Làm rối và loại bỏ chú thích/khoảng trắng)
    def _minify_css(raw_css):
        c = re.sub(r'/\*[\s\S]*?\*/', '', raw_css)
        c = re.sub(r'\s+', ' ', c)
        c = re.sub(r'\s*([\{\};:,>~])\s*', r'\1', c)
        c = re.sub(r'\band\(', 'and (', c)
        c = re.sub(r'\bor\(', 'or (', c)
        c = re.sub(r'\bnot\(', 'not (', c)
        c = re.sub(r'calc\(([^)]+)\)', lambda m: 'calc(' + re.sub(r'(?<=[0-9a-zA-Z%])([+\-])(?=[0-9a-zA-Z%])', r' \1 ', m.group(1)) + ')', c)
        return "/* IDLE RPG PROTECTED STYLESHEET - DO NOT MODIFY */\n" + c.strip()

    css_src = os.path.join(base_dir, "css")
    css_dst = os.path.join(dist_dir, "css")
    os.makedirs(css_dst, exist_ok=True)
    if os.path.exists(css_src):
        for f in os.listdir(css_src):
            src_f = os.path.join(css_src, f)
            if os.path.isfile(src_f):
                if f.endswith('.css'):
                    with open(src_f, 'r', encoding='utf-8') as cf:
                        min_css = _minify_css(cf.read())
                    with open(os.path.join(css_dst, f), 'w', encoding='utf-8') as cf:
                        cf.write(min_css)
                    if os.path.exists(server_static):
                        static_css = os.path.join(server_static, "css")
                        os.makedirs(static_css, exist_ok=True)
                        with open(os.path.join(static_css, f), 'w', encoding='utf-8') as cf:
                            cf.write(min_css)
                        with open(os.path.join(server_static, f), 'w', encoding='utf-8') as cf:
                            cf.write(min_css)
                else:
                    shutil.copy2(src_f, os.path.join(css_dst, f))

    assets_src = os.path.join(base_dir, "assets")
    assets_dst = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_src):
        shutil.copytree(assets_src, assets_dst, dirs_exist_ok=True)
        if os.path.exists(server_static):
            static_assets = os.path.join(server_static, "assets")
            shutil.copytree(assets_src, static_assets, dirs_exist_ok=True)

    # 4. Tạo index.html cho bản phân phối (chỉ nạp bundle.js)
    src_html = os.path.join(base_dir, "index.html")
    with open(src_html, "r", encoding="utf-8") as f:
        html = f.read()

    # Thay thế khối các file script đơn lẻ bằng 1 file bundle duy nhất
    script_block_pattern = r'<!-- Scripts theo từng phân hệ chức năng -->[\s\S]*?<\/body>'
    replacement = """<!-- Protected Production Bundle -->
  <script src="js/game.bundle.js"></script>
</body>"""
    dist_html = re.sub(script_block_pattern, replacement, html)

    dist_html_file = os.path.join(dist_dir, "index.html")
    with open(dist_html_file, "w", encoding="utf-8") as f:
        f.write(dist_html)
    shutil.copy2(dist_html_file, os.path.join(server_static, "index.html"))

    # 5. Biên dịch bản IdleRPG.exe trực tiếp vào dist/
    print("🔨 [4/4] Đang biên dịch bản thực thi IdleRPG.exe cho thư mục phân phối...")
    csc_compiler = r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
    launcher_src = os.path.join(base_dir, "launcher", "Launcher.cs")
    dist_exe = os.path.join(dist_dir, "IdleRPG.exe")

    if os.path.exists(csc_compiler) and os.path.exists(launcher_src):
        cmd = [
            csc_compiler,
            "/target:winexe",
            f"/out:{dist_exe}",
            "/optimize",
            "/platform:anycpu",
            launcher_src
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"✨ Biên dịch thành công IdleRPG.exe trong dist/!")
        else:
            out_err = (res.stderr or "") + " " + (res.stdout or "")
            if "used by another process" in out_err or "cannot access" in out_err:
                print("ℹ️ File IdleRPG.exe đang chạy, đã giữ nguyên bản exe hiện tại và cập nhật toàn bộ bundle mã nguồn.")
            else:
                print(f"⚠️ Cảnh báo lỗi csc: {out_err}")

    # 6. Đóng gói file nén IdleRPG_Online_Latest.zip tự động
    print("📦 [5/5] Đang nén toàn bộ bản phân phối thành IdleRPG_Online_Latest.zip...")
    zip_path = os.path.join(base_dir, "IdleRPG_Online_Latest.zip")
    import zipfile
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(dist_dir):
            for file in files:
                abs_file = os.path.join(root, file)
                rel_file = os.path.relpath(abs_file, dist_dir)
                zf.write(abs_file, rel_file)
    print(f"✨ Đã tạo gói zip tải về thành công: {zip_path} ({os.path.getsize(zip_path):,} bytes)")

    print("\n🎉 HOÀN TẤT ĐÓNG GÓI! Bản cài đặt phân phối đã sẵn sàng tại:")
    print(f"👉 {dist_dir}")
    print(f"👉 {zip_path} (Sẵn sàng up lên Google Drive)")
    print("Người chơi chỉ cần giải nén thư mục 'dist' (hoặc file zip) và mở 'IdleRPG.exe' là chơi ngay!")

if __name__ == "__main__":
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    build_dist_release(base)
