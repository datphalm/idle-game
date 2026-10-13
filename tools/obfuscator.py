#!/usr/bin/env python3
"""
IDLE RPG - CODE OBFUSCATION & PRODUCTION BUILD PIPELINE
Đóng gói, làm rối mã nguồn nhiều tầng (Multi-layer Obfuscation), chống sao chép và bảo vệ bản quyền game.
"""

import os
import re
import sys
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
 * IDLE RPG — PROTECTED PRODUCTION BUILD v2.1.0
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

    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir, exist_ok=True)

    # 1. Tạo bundle obfuscated
    bundle_target = os.path.join(dist_dir, "js", "game.bundle.js")
    build_obfuscated_bundle(base_dir, bundle_target)

    # 2. Copy libs (three.min.js)
    three_src = os.path.join(base_dir, "js", "libs", "three.min.js")
    three_dst = os.path.join(dist_dir, "js", "libs", "three.min.js")
    os.makedirs(os.path.dirname(three_dst), exist_ok=True)
    if os.path.exists(three_src):
        shutil.copy2(three_src, three_dst)

    # 3. Copy css
    css_src = os.path.join(base_dir, "css")
    css_dst = os.path.join(dist_dir, "css")
    if os.path.exists(css_src):
        shutil.copytree(css_src, css_dst)

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

    with open(os.path.join(dist_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(dist_html)

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
            print(f"⚠️ Cảnh báo lỗi csc: {res.stderr}")

    print("\n🎉 HOÀN TẤT ĐÓNG GÓI! Bản cài đặt phân phối đã sẵn sàng tại:")
    print(f"👉 {dist_dir}")
    print("Người chơi chỉ cần giải nén thư mục 'dist' và mở 'IdleRPG.exe' là chơi ngay!")

if __name__ == "__main__":
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    build_dist_release(base)
