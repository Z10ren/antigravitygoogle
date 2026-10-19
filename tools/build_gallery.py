#!/usr/bin/env python3
"""
Rebuild the gallery list for the good-luck site.

Run it from the project folder after adding or removing files in media/:

    python3 tools/build_gallery.py

What it does
  * Reads every photo/video in media/ (it never renames, moves or edits them).
  * Groups them by the date at the start of the filename, written MM:DD:YYYY,
    e.g. "10:06:2026 - something.jpeg"  ->  shown on the site as 10-06-2026.
    (Finder shows the colons as slashes: "10/06/2026 - something.jpeg".)
  * Files without a clear date prefix are skipped and listed as a warning —
    the script never guesses a date.
  * Makes small preview images in media/thumbs/ and video cover frames in
    media/posters/ so the page loads fast on a phone. The site falls back to
    the original file if a preview is missing.
  * Writes assets/js/gallery-data.js, which the page reads.

Optional helpers (the script still works without them):
  * Pillow  (pip3 install pillow)  or macOS `sips`  -> photo previews
  * ffmpeg / ffprobe                                  -> video covers + sizes
"""

import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, "media")
THUMBS = os.path.join(MEDIA, "thumbs")
POSTERS = os.path.join(MEDIA, "posters")
OUT = os.path.join(ROOT, "assets", "js", "gallery-data.js")

PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".webm"}
THUMB_WIDTH = 720          # px, plenty for a phone grid at 3x
THUMB_MAX_HEIGHT = 2200    # tall photo-strips stay sharp but light
JPEG_QUALITY = 82

# MM:DD:YYYY at the very start of the name, followed by a space, dash,
# underscore, dot or the end of the name.
DATE_RE = re.compile(r"^(\d{2}):(\d{2}):(\d{4})(?=[\s\-_.]|$)")

try:
    from PIL import Image, ImageOps  # type: ignore
    HAVE_PIL = True
except Exception:  # pragma: no cover
    HAVE_PIL = False

HAVE_SIPS = shutil.which("sips") is not None
HAVE_FFMPEG = shutil.which("ffmpeg") is not None
HAVE_FFPROBE = shutil.which("ffprobe") is not None


def parse_date(name):
    m = DATE_RE.match(name)
    if not m:
        return None
    mm, dd, yyyy = (int(x) for x in m.groups())
    try:
        d = dt.date(yyyy, mm, dd)
    except ValueError:
        return None
    return d


def label_from(name):
    """The words after the date, used only as hidden alt text."""
    stem = os.path.splitext(name)[0]
    stem = DATE_RE.sub("", stem)
    return stem.strip(" -_.") or "memory"


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def safe_path(path):
    """ffmpeg reads '10:06:...' as a protocol, so always pass ./paths."""
    return path if os.path.isabs(path) else "./" + path


def newer(src, dst):
    return not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)


def photo_size(path):
    if HAVE_PIL:
        try:
            with Image.open(path) as im:
                im = ImageOps.exif_transpose(im)
                return im.size
        except Exception:
            pass
    if HAVE_SIPS:
        try:
            out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                                 capture_output=True, text=True, check=True).stdout
            w = int(re.search(r"pixelWidth:\s*(\d+)", out).group(1))
            h = int(re.search(r"pixelHeight:\s*(\d+)", out).group(1))
            return w, h
        except Exception:
            pass
    return None


def make_photo_thumb(src, dst):
    if not newer(src, dst):
        return True
    if HAVE_PIL:
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)
                if im.mode not in ("RGB", "L"):
                    bg = Image.new("RGB", im.size, (255, 253, 248))
                    im = im.convert("RGBA")
                    bg.paste(im, mask=im.split()[-1])
                    im = bg
                im.thumbnail((THUMB_WIDTH, THUMB_MAX_HEIGHT), Image.LANCZOS)
                im.save(dst, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            return True
        except Exception as e:
            print(f"  ! preview failed for {os.path.basename(src)}: {e}")
    if HAVE_SIPS:
        try:
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(JPEG_QUALITY),
                            "--resampleWidth", str(THUMB_WIDTH), src, "--out", dst],
                           capture_output=True, check=True)
            return True
        except Exception as e:
            print(f"  ! sips preview failed for {os.path.basename(src)}: {e}")
    return False


def video_has_audio(path):
    """True/False when ffprobe can tell, None when it can't."""
    if not HAVE_FFPROBE:
        return None
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
             "-of", "csv=p=0", safe_path(path)],
            capture_output=True, text=True, check=True).stdout
        return bool(out.strip())
    except Exception:
        return None


def video_info(path):
    if not HAVE_FFPROBE:
        return None, None, None
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height:stream_side_data=rotation:format=duration",
             "-of", "json", safe_path(path)],
            capture_output=True, text=True, check=True).stdout
        info = json.loads(out)
        st = (info.get("streams") or [{}])[0]
        w, h = st.get("width"), st.get("height")
        rot = 0
        for sd in st.get("side_data_list", []) or []:
            if "rotation" in sd:
                rot = int(float(sd["rotation"]))
        if abs(rot) % 180 == 90 and w and h:
            w, h = h, w
        dur = float(info.get("format", {}).get("duration") or 0) or None
        return w, h, dur
    except Exception:
        return None, None, None


def make_poster(src, dst, duration):
    if not HAVE_FFMPEG:
        return False
    if not newer(src, dst):
        return True
    t = 0.4 if not duration or duration > 1 else 0
    try:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", safe_path(src),
             "-frames:v", "1", "-vf", f"scale='min({THUMB_WIDTH},iw)':-2",
             "-q:v", "3", safe_path(dst)],
            capture_output=True, check=True)
        return True
    except Exception as e:
        print(f"  ! cover frame failed for {os.path.basename(src)}: {e}")
        return False


def main():
    if not os.path.isdir(MEDIA):
        sys.exit("No media/ folder found next to tools/.")
    os.makedirs(THUMBS, exist_ok=True)
    os.makedirs(POSTERS, exist_ok=True)

    groups = {}
    skipped = []
    names = sorted(n for n in os.listdir(MEDIA)
                   if os.path.isfile(os.path.join(MEDIA, n)) and not n.startswith("."))

    for name in names:
        ext = os.path.splitext(name)[1].lower()
        if ext not in PHOTO_EXT | VIDEO_EXT:
            if ext in {".heic", ".heif"}:
                skipped.append((name, "HEIC isn't shown by most browsers — export it as JPEG"))
            continue
        d = parse_date(name)
        if d is None:
            skipped.append((name, "no clear MM:DD:YYYY date at the start of the name"))
            continue

        src = os.path.join(MEDIA, name)
        item = {"file": rel(src), "label": label_from(name)}

        if ext in PHOTO_EXT:
            item["type"] = "photo"
            size = photo_size(src)
            thumb = os.path.join(THUMBS, name + ".jpg")
            if make_photo_thumb(src, thumb):
                item["thumb"] = rel(thumb)
        else:
            item["type"] = "video"
            w, h, dur = video_info(src)
            size = (w, h) if w and h else None
            if dur:
                item["duration"] = round(dur, 1)
            has_audio = video_has_audio(src)
            if has_audio is not None:
                # silent clips let the background song keep playing
                item["audio"] = has_audio
            poster = os.path.join(POSTERS, name + ".jpg")
            if make_poster(src, poster, dur):
                item["poster"] = rel(poster)

        if size:
            item["w"], item["h"] = size
        groups.setdefault(d, []).append(item)

    data = {
        "groups": [
            {"date": d.strftime("%m-%d-%Y"), "items": groups[d]}
            for d in sorted(groups)
        ]
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* Made by tools/build_gallery.py — rebuild instead of editing by hand. */\n")
        f.write("window.GALLERY_DATA = ")
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    total = sum(len(v) for v in groups.values())
    print(f"Gallery: {total} files in {len(groups)} date groups -> {rel(OUT)}")
    for g in data["groups"]:
        print(f"  {g['date']}: {len(g['items'])}")
    if skipped:
        print("\nLeft out (not guessed):")
        for name, why in skipped:
            print(f"  - {name}  ({why})")
    if not (HAVE_PIL or HAVE_SIPS):
        print("\nNote: no Pillow or sips found, so photo previews weren't made (originals will be used).")
    if not HAVE_FFMPEG:
        print("Note: ffmpeg not found, so video cover frames weren't made.")


if __name__ == "__main__":
    main()
