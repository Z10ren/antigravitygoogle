# For Beem — a good-luck gift

A small personal website made as a good-luck gift before Beem's defense.
**It is not affiliated with Google or Antigravity, and it is not a product page or installer.**
The page title and the link preview say so.

Live address once Pages is on: **https://z10ren.github.io/antigravitygoogle/**
Custom address (after buying the domain, see section 4): **https://www.beantigravgoogle.com**

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

## 3. Publish on GitHub Pages

The repository is **https://github.com/Z10ren/antigravitygoogle** (public, branch `main`) and already holds every file, including the media with their original names.

**Use Git or GitHub Desktop for changes, not the drag-and-drop uploader on github.com.** The media filenames contain colons (Finder shows them as slashes, like `10/06/2026 - …`), and the browser uploader can't keep those names.

### a. Turn on Pages (one time)
1. Open https://github.com/Z10ren/antigravitygoogle/settings/pages (signed in as Z10ren)
2. Build and deployment → Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)** → **Save**
4. Wait 1–3 minutes. The address shows at the top of that page:
   **https://z10ren.github.io/antigravitygoogle/**

### b. Updating later
Work from a clone of the repository so you're always in step with GitHub. Saving a custom domain (section 4) adds a `CNAME` file on GitHub, and a clone picks that up.

**GitHub Desktop:** File → Clone Repository → `Z10ren/antigravitygoogle` → make changes → Commit to main → Push origin.

**Terminal:**
```bash
git clone https://github.com/Z10ren/antigravitygoogle.git
cd antigravitygoogle
# …make changes…
git add .
git commit -m "Update"
git push
```
Pages redeploys on its own in a minute or two. If a phone still shows the old version, reload it.

### c. Quick check after it's live (on a phone)
- "Tap to start" starts the song, then the bouquet blooms and the three date groups appear.
- Pause and mute work.
- Each video plays when tapped.
- The envelope opens to the letter, and zoom works.

## 4. Custom domain: www.beantigravgoogle.com

As of Oct 19, 2026, `beantigravgoogle.com` is **not registered**, so it has to be bought first.

1. **Buy the domain** from any registrar (for example Porkbun, Namecheap, Cloudflare or GoDaddy).
2. **Verify it with GitHub** (recommended; it stops anyone else from claiming it on GitHub):
   your profile → Settings → Pages → **Add a domain** → `beantigravgoogle.com`, then add the TXT record GitHub shows you at the registrar.
3. **Add it to the site:** repo → Settings → Pages → Custom domain → `www.beantigravgoogle.com` → Save.
   GitHub adds a `CNAME` file to the repository for you.
4. **DNS records at the registrar:**

   | Type | Host / Name | Value |
   |---|---|---|
   | CNAME | `www` | `z10ren.github.io` |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | AAAA (optional) | `@` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |

   The `A` records make `beantigravgoogle.com` (without www) forward to `www.` too. Remove any default "parking" records the registrar added for `@` or `www`.
5. Back in Settings → Pages, wait for the DNS check to pass, then tick **Enforce HTTPS**. The certificate can take up to 24 hours, though it's usually minutes.
6. Optional: in `index.html`, change the two `og:` lines (`og:url`, `og:image`) from `https://z10ren.github.io/antigravitygoogle/` to `https://www.beantigravgoogle.com/` so link previews use the new address.

The site uses relative paths, so it works the same at the custom domain. The old `z10ren.github.io/antigravitygoogle/` link then redirects there automatically.

**Don't save the custom domain in step 3 until you've actually bought it.** Once it's saved, the github.io link redirects to the new address, and that address won't load until the DNS is in place.

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
