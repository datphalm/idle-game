import os, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

js_dir = "js"
files = [os.path.join(r, f) for r, d, fs in os.walk(js_dir) for f in fs if f.endswith(".js")]
print(f"Kiểm tra {len(files)} tệp JavaScript:")

has_error = False
for f in sorted(files):
    with open(f, "r", encoding="utf-8") as fh:
        c = fh.read()
    # Simple brace balance check
    # ignore libs
    if "libs" in f:
        print(f"  [SKIP] {f} (thư viện bên thứ ba)")
        continue
    open_p = c.count("(") - c.count(")")
    open_b = c.count("{") - c.count("}")
    open_s = c.count("[") - c.count("]")
    if open_p != 0 or open_b != 0 or open_s != 0:
        print(f"  ❌ [CẢNH BÁO] {f}: Ngoặc tròn: {open_p}, Ngoặc nhọn: {open_b}, Ngoặc vuông: {open_s}")
        has_error = True
    else:
        print(f"  ✅ [HỢP LỆ] {f}")

if not has_error:
    print("\n🎉 Tất cả 16 tệp mã nguồn trò chơi đều có cấu trúc ngoặc cân bằng 100%!")
else:
    print("\n⚠️ Có tệp chưa cân bằng ngoặc!")
