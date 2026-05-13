"""
Safe Android screenshot helper.

Captures via `adb exec-out screencap -p` and ALWAYS produces two files:
  - <name>.png        Original, full resolution (1344x2992 on Pixel 9 Pro XL).
                      Used for embedding in .docx (high quality).
  - <name>_thumb.png  Thumbnail, max 1500 px on the long side, lossy JPEG-like.
                      THIS is the only file safe to pass to Claude's Read tool —
                      the original exceeds the 2000 px multi-image cap and
                      bricks the session.

Usage:
    python safe_capture.py shot <name>            # take a screenshot
    python safe_capture.py shrink <png>           # produce thumb for an existing png
    python safe_capture.py shrink_all <dir>       # produce thumbs for every png in dir
"""
from __future__ import annotations
import os, sys, subprocess, time
from pathlib import Path
from PIL import Image

ADB = r"C:\Users\USUARIO\AppData\Local\Android\Sdk\platform-tools\adb.exe"
HERE = Path(__file__).resolve().parent
OUT  = HERE / "figuras_capturas"
OUT.mkdir(parents=True, exist_ok=True)

MAX_SIDE = 1500  # well under the 2000 px API cap


def shrink_to_thumb(src: Path, dst: Path | None = None) -> Path:
    """Write a thumbnail with max(long_side) <= MAX_SIDE next to the original."""
    if dst is None:
        dst = src.with_name(src.stem + "_thumb.png")
    with Image.open(src) as im:
        im = im.convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        im.save(dst, "PNG", optimize=True)
    return dst


def shot(name: str) -> tuple[Path, Path]:
    """Take a screenshot, save original + thumb, return both paths."""
    if not name.endswith(".png"):
        name = name + ".png"
    original = OUT / name
    # adb exec-out screencap -p streams raw PNG bytes
    raw = subprocess.run(
        [ADB, "exec-out", "screencap", "-p"],
        capture_output=True, check=True,
    ).stdout
    original.write_bytes(raw)
    thumb = shrink_to_thumb(original)
    w, h = Image.open(original).size
    tw, th = Image.open(thumb).size
    print(f"  OK  {original.name}  {w}x{h}  ({original.stat().st_size//1024} KB)")
    print(f"      -> thumb {thumb.name}  {tw}x{th}  ({thumb.stat().st_size//1024} KB)")
    return original, thumb


def shrink_all(directory: Path) -> None:
    for f in sorted(directory.glob("*.png")):
        if f.stem.endswith("_thumb"):
            continue
        thumb = f.with_name(f.stem + "_thumb.png")
        if thumb.exists() and thumb.stat().st_mtime >= f.stat().st_mtime:
            continue
        try:
            shrink_to_thumb(f, thumb)
            w, h = Image.open(thumb).size
            print(f"  THUMB {thumb.name}  {w}x{h}")
        except Exception as e:
            print(f"  FAIL  {f.name}  {e}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "shot":
        shot(sys.argv[2])
    elif cmd == "shrink":
        out = shrink_to_thumb(Path(sys.argv[2]))
        print(f"  -> {out}")
    elif cmd == "shrink_all":
        shrink_all(Path(sys.argv[2]) if len(sys.argv) > 2 else OUT)
    else:
        print(__doc__)
