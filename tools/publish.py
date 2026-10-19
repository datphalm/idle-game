#!/usr/bin/env python3
import os
import sys
import json
import subprocess
from obfuscator import build_dist_release

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    version_file = os.path.join(base_dir, "version.json")

    commit_msg = "Update game release"
    if len(sys.argv) > 1:
        commit_msg = " ".join(sys.argv[1:])

    if os.path.exists(version_file):
        with open(version_file, "r", encoding="utf-8") as f:
            v_data = json.load(f)
        ver = v_data.get("version", "2.8.1")
        parts = ver.split(".")
        if len(parts) == 3 and parts[2].isdigit():
            parts[2] = str(int(parts[2]) + 1)
            v_data["version"] = ".".join(parts)
            v_data["title"] = f"Bản Cập Nhật v{v_data['version']}"
            with open(version_file, "w", encoding="utf-8") as f:
                json.dump(v_data, f, ensure_ascii=False, indent=2)
            print(f"Bumped version to {v_data['version']}")

    build_dist_release(base_dir)

    print("Staging and pushing changes to GitHub...")
    subprocess.run(["git", "add", "."], cwd=base_dir, check=True)
    subprocess.run(["git", "commit", "-m", commit_msg], cwd=base_dir, check=True)
    subprocess.run(["git", "push", "origin", "main"], cwd=base_dir, check=True)
    print("All changes successfully pushed to Git! Auto-updater is now active for all clients.")

if __name__ == "__main__":
    main()
