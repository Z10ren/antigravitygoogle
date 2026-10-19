# For Beem — a good-luck gift

A small personal website made as a good-luck gift before Beem's defense.
**It is not affiliated with Google or Antigravity, and it is not a product page or installer.**
The page title and the link preview say so.

Live address once published: **https://z10ren.github.io/antigravitygoogle/**

---

## What happens on the page

1. **Tap to start.** The page opens on a small "for Beem" screen with one pink button. Her tap starts *I'll Be (Acoustic Version)*. Phones only allow sound after a tap, and here the tap is part of the moment.
2. The song plays on its own for a couple of seconds while "A gift of good luck before your defense" and the camera viewfinder fade in. Then the tulips grow and bloom into a wrapped bouquet, the camera focuses, and the flash goes off.
3. The photos and videos appear, grouped by the date at the start of each filename (`10:06:2026 - …` → **10-06-2026**). The date is the only caption. Tap any print to view it full screen (swipe or use the arrows).
4. At the end, the line beside the closed envelope. Tap it, it opens, and the scanned letter appears, uncropped, with zoom (buttons, pinch, double-tap) and an "open full size" link.
5. The song keeps playing (on loop) through the whole page. Play/pause and mute are at the bottom right. The two videos with their own sound pause the song while they play, and it picks up again afterwards. Silent photobooth clips leave it playing.

## Folder map

```
index.html                  the page
assets/css/style.css        look and animations
assets/js/main.js           behaviour (easy settings at the top)
assets/js/gallery-data.js   list of photos/videos (made by the script below)
assets/fonts/               self-hosted fonts (Fraunces, Nunito, VT323 — SIL OFL)
assets/img/                 favicon + link-preview image
media/                      your original photos and videos, names unchanged
media/thumbs/, posters/     small previews so it loads fast on a phone
music/                      the song, unchanged
letter/                     ← put the scanned letter here
tools/build_gallery.py      rebuilds gallery-data.js after media changes
.nojekyll                   tells GitHub Pages to serve files as-is
```

---

## 1. Add the scanned letter

1. Export the scan as **JPG or PNG** (not HEIC or PDF). On a Mac: open it in Preview → File → Export → JPEG.
2. Save it as **`letter/letter.jpg`** inside this folder.
   - `letter.jpeg`, `letter.png` and `letter.webp` work too.
   - More pages: `letter-2.jpg`, `letter-3.jpg`, … (same file type as page 1).
3. Keep the whole page. The site never crops it.
4. Open `index.html` to check, then publish (step 3 below, or just commit and push again if it's already live).

Until a scan is in `letter/`, the envelope opens to a dashed "The scanned letter goes here" placeholder.

## 2. Preview on your Mac

Double-click `index.html`. Everything works from the file. For the closest match to the live site, run a tiny local server instead:

```bash
cd ~/websites/antigravitygoogle
python3 -m http.server 8000
# then open http://localhost:8000
```

## 3. Publish on GitHub Pages (repository: `antigravitygoogle`)

**Use Git or GitHub Desktop, not the drag-and-drop uploader on github.com.** The media filenames contain colons (Finder shows them as slashes, like `10/06/2026 - …`), and the browser uploader can mangle those names. Git keeps them exactly as they are.

### a. Create the empty repository
1. Go to https://github.com/new
2. Repository name: **`antigravitygoogle`**
3. Visibility: **Public** (free GitHub Pages needs a public repo, see the privacy note below)
4. Leave "Add a README", .gitignore and license **unticked** → **Create repository**

### b. Push this folder

**With Terminal:**
```bash
cd ~/websites/antigravitygoogle
git init
git add .
git commit -m "Good-luck gift for Beem"
git branch -M main
git remote add origin https://github.com/Z10ren/antigravitygoogle.git
git push -u origin main
```

**Or with GitHub Desktop:** File → Add Local Repository → choose `~/websites/antigravitygoogle` → "create a repository" if asked → Commit to main → Publish repository (untick "Keep this code private") → name `antigravitygoogle`.

### c. Turn on Pages
1. On GitHub, open the repo → **Settings** → **Pages**
2. Build and deployment → Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)** → **Save**
4. Wait 1–3 minutes. The address appears at the top of that page:
   **https://z10ren.github.io/antigravitygoogle/**

### d. Updating later
Change files, then:
```bash
git add .
git commit -m "Add the letter"
git push
```
Pages redeploys on its own in a minute or two. If the phone still shows the old version, reload it.

### e. Quick check after it's live (on a phone)
- "Tap to start" starts the song, then the bouquet blooms and the three date groups appear.
- Pause and mute work.
- Each video plays when tapped.
- The envelope opens to the letter (or the placeholder), and zoom works.

If your GitHub username isn't `Z10ren`, swap it into the two `og:` lines near the top of `index.html` (they power the link preview). Nothing else needs changing.

---

## Adding or removing photos and videos later

1. Put the file in `media/` named with the date first: `MM:DD:YYYY - anything.jpeg`.
   In Finder, type it with slashes: `10/20/2026 - anything.jpeg`.
2. Run:
   ```bash
   cd ~/websites/antigravitygoogle
   python3 tools/build_gallery.py
   ```
   It regroups everything, makes previews (with Pillow or macOS `sips`) and video covers (with `ffmpeg`, if installed), and lists any file it skipped because its date wasn't clear. **It never guesses a date and never renames files.**
3. Commit and push.

Supported: JPG/JPEG, PNG, WebP, GIF, MP4, MOV, M4V, WebM. iPhone HEIC photos should be exported as JPEG first.

## Small settings

At the top of `assets/js/main.js`:
- `song` / `songTitle`: the background track
- `listenBeforeBloom`: how long the song plays on its own after "tap to start" before the tulips bloom (now 2200 ms; e.g. `5000` for 5 seconds)
- `letterBase`: where the letter scan is looked for (`letter/letter`)

## Good to know

- **Privacy:** a public repo means anyone with the link can see the photos, videos and letter, and browse the repository itself. The address isn't listed anywhere, but it isn't secret either.
- **The song** is a commercial recording, used here as-is. GitHub can remove files if a rights holder files a takedown, which is rare for small personal pages but possible.
- Fonts are self-hosted under the SIL Open Font License (licenses in `assets/fonts/`).
