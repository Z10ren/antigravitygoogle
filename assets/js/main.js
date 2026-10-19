/* ==========================================================
   For Beem — a good-luck gift
   ========================================================== */

/* ----------------------------------------------------------
   Easy-edit settings
   ---------------------------------------------------------- */
const SETTINGS = {
  // Background song (played as-is).
  song: "music/I'll Be (Acoustic Version).mp3",
  songTitle: "I'll Be (Acoustic Version)",
  // After the "tap to start", how long the song plays on its own
  // before the tulips start blooming (milliseconds).
  listenBeforeBloom: 2200,

  // The scanned handwritten letter.
  // Save the scan as  letter/letter.jpg  (or .jpeg / .png / .webp).
  // More than one page?  letter/letter-2.jpg, letter/letter-3.jpg, ...
  letterBase: "letter/letter",
  letterExts: ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"],
  maxLetterPages: 8
};

/* ----------------------------------------------------------
   Helpers
   ---------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const wait = ms => new Promise(r => setTimeout(r, ms));
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const body = document.body;
const pad = (n, w = 2) => String(n).padStart(w, "0");
// File names keep their colons, spaces and apostrophes — encode them for URLs.
const enc = p => String(p).split("/").map(encodeURIComponent).join("/");
const SVGNS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "text") n.textContent = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  [].concat(kids).forEach(k => k && n.append(k));
  return n;
}

function fmtDur(s) {
  if (!s || !isFinite(s)) return "";
  const m = Math.floor(s / 60);
  return `${m}:${pad(Math.round(s % 60))}`;
}

/* ----------------------------------------------------------
   Seven-segment digits, like an old camera's date imprint
   ---------------------------------------------------------- */
function sevenSeg(text) {
  const W = 12, H = 22, T = 2.7, G = 0.6, ADV = 15.5, DASH_ADV = 13;
  const L = T / 2, R = W - T / 2, TOP = T / 2, M = H / 2, B = H - T / 2;
  const hz = (cy, x1, x2) =>
    `${x1},${cy} ${x1 + T / 2},${cy - T / 2} ${x2 - T / 2},${cy - T / 2} ${x2},${cy} ${x2 - T / 2},${cy + T / 2} ${x1 + T / 2},${cy + T / 2}`;
  const vt = (cx, y1, y2) =>
    `${cx},${y1} ${cx + T / 2},${y1 + T / 2} ${cx + T / 2},${y2 - T / 2} ${cx},${y2} ${cx - T / 2},${y2 - T / 2} ${cx - T / 2},${y1 + T / 2}`;
  const SEG = {
    a: hz(TOP, L + G, R - G), b: vt(R, TOP + G, M - G), c: vt(R, M + G, B - G),
    d: hz(B, L + G, R - G), e: vt(L, M + G, B - G), f: vt(L, TOP + G, M - G), g: hz(M, L + G, R - G)
  };
  const MAP = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd",
                6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g" };
  let x = 0, on = "", off = "";
  for (const ch of text) {
    const lit = MAP[ch] || "";
    for (const k of "abcdefg") {
      const poly = `<polygon points="${SEG[k]}" transform="translate(${x} 0)"/>`;
      if (lit.includes(k)) on += poly;
      else if (ch !== "-") off += poly;
    }
    x += ch === "-" ? DASH_ADV : ADV;
  }
  const w = x - (ADV - W) + 4;
  return `<svg class="seg" viewBox="-1 -1 ${w} ${H + 2}" aria-hidden="true" focusable="false">` +
    `<g transform="translate(3 0) skewX(-7)"><g class="off">${off}</g><g class="on lit">${on}</g></g></svg>`;
}

/* ----------------------------------------------------------
   Gallery data
   ---------------------------------------------------------- */
const DATA = (window.GALLERY_DATA && window.GALLERY_DATA.groups) || [];
const FLAT = [];   // every item in order, for the viewer

/* ----------------------------------------------------------
   Tulip bouquet (SVG)
   ---------------------------------------------------------- */
const PALETTE = {
  butter: ["#fde8a6", "#f6cd62", "#e3ab3e"],
  cream:  ["#fdf5e5", "#f2e1c1", "#dfc398"],
  blush:  ["#fbd0da", "#f3a7ba", "#e0829a"],
  lilac:  ["#ecdcf5", "#d2b9e9", "#b296d5"],
  rose:   ["#f8afc1", "#ea8aa2", "#d06581"],
  peach:  ["#fdd9c4", "#f7b596", "#e89270"]
};
// where each flower head sits (x, y), its colour and size — drawn back to front
const BASE = { x: 160, y: 318 };
const TULIPS = [
  { x: 130, y: 126, c: "blush",  s: 1.16 },
  { x: 170, y: 108, c: "butter", s: 1.2 },
  { x: 209, y: 132, c: "lilac",  s: 1.14 },
  { x: 95,  y: 166, c: "peach",  s: 1.12 },
  { x: 150, y: 150, c: "cream",  s: 1.18 },
  { x: 195, y: 156, c: "rose",   s: 1.16 },
  { x: 233, y: 174, c: "butter", s: 1.08 },
  { x: 124, y: 196, c: "lilac",  s: 1.1 },
  { x: 178, y: 192, c: "blush",  s: 1.12 }
].map(t => {
  const dx = t.x - BASE.x, dy = BASE.y - t.y;
  return Object.assign(t, { a: Math.atan2(dx, dy) * 180 / Math.PI, len: Math.round(Math.hypot(dx, dy)) });
});
const PETAL_BACK = "M0 -44C9 -36 15 -22 14 -8C13 2 7 7 0 7C-7 7 -13 2 -14 -8C-15 -22 -9 -36 0 -44Z";
const PETAL_LEFT = "M3 8C-9 9 -18 1 -19 -12C-20 -24 -16 -33 -12 -40C-6 -32 0 -21 3 -6Z";
const PETAL_RIGHT = "M-3 8C9 9 18 1 19 -12C20 -24 16 -33 12 -40C6 -32 0 -21 -3 -6Z";
const LEAF = "M0 0C-9 -10 -13 -28 -6 -52C0 -34 3 -16 0 0Z";
const BLADE = "M0 0C-15 -40 -20 -95 -5 -150C2 -95 5 -40 0 0Z";

function buildBouquet() {
  const t = (s) => `${s.toFixed(2)}s`;
  const parts = [];

  // two long leaves rising behind everything
  [[-40, "#8db878", .6], [37, "#7fa86c", .7], [-56, "#7fa86c", .8], [54, "#8db878", .9]].forEach(([a, fill, d]) => {
    parts.push(`<g transform="translate(${BASE.x} ${BASE.y}) rotate(${a})"><path class="tl-leaf" style="--d:${t(d)}" d="${BLADE}" fill="${fill}"/></g>`);
  });

  // back sheets of wrapping paper
  parts.push(`<g class="wrap-part" style="--d:${t(3.0)}">
    <path d="M150 352L66 214Q90 194 122 199L164 352Z" fill="#f8d4dd"/>
    <path d="M170 352L254 214Q230 194 198 199L156 352Z" fill="#f2c0ce"/>
    <path d="M160 352L108 206Q160 190 212 206Z" fill="#ead3b0"/>
  </g>`);

  TULIPS.forEach((tp, i) => {
    const [light, mid, dark] = PALETTE[tp.c];
    const L = tp.len, k = i % 2 ? 6 : -6;
    const dStem = 0.35 + i * 0.09;
    const dLeaf = 0.95 + i * 0.07;
    const dHead = dStem + 0.85;
    const dBloom = 2.05 + i * 0.08;
    const leafSide = i % 2 ? -1 : 1;
    const leaf = i < 7
      ? `<g transform="translate(0 ${(-L * 0.52).toFixed(1)}) scale(${leafSide} 1) rotate(-26)"><path class="tl-leaf" style="--d:${t(dLeaf)}" d="${LEAF}" fill="${i % 3 ? "#93bb7e" : "#82ab6e"}"/></g>`
      : "";
    parts.push(`
      <g transform="translate(${BASE.x} ${BASE.y}) rotate(${tp.a})">
        <g class="tl-sway" style="--sd:${t(-i * 0.7)}">
          <path class="tl-stem" style="--d:${t(dStem)}" d="M0 0C${k} ${(-L * 0.35).toFixed(1)} ${-k} ${(-L * 0.68).toFixed(1)} 0 ${-(L - 4)}"/>
          ${leaf}
          <g transform="translate(0 ${-L}) scale(${tp.s})">
            <g class="tl-head-pop" style="--d:${t(dHead)}">
              <path class="tl-petal tl-petal--b" style="--d:${t(dBloom)}" d="${PETAL_BACK}" fill="${dark}"/>
              <g class="tl-petal tl-petal--l" style="--d:${t(dBloom)}"><path d="${PETAL_LEFT}" fill="${mid}"/></g>
              <g class="tl-petal tl-petal--r" style="--d:${t(dBloom + .04)}">
                <path d="${PETAL_RIGHT}" fill="${light}"/>
                <path d="M12.5 -31C15.5 -23 15.5 -13 11.5 -5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>
              </g>
            </g>
          </g>
        </g>
      </g>`);
  });

  // kraft + pink front wrap, then the ribbon
  parts.push(`<g class="wrap-part" style="--d:${t(3.15)}">
    <path d="M100 242Q116 230 132 240Q146 229 160 239Q174 229 188 240Q204 230 220 242L176 356H144Z" fill="#e8cda8"/>
    <path d="M82 234Q132 224 182 248L171 356H148Z" fill="url(#wrapL)"/>
    <path d="M238 234Q188 224 138 248L149 356H172Z" fill="url(#wrapR)"/>
    <path d="M84 235Q132 226 180 248" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.4"/>
    <path d="M236 235Q188 226 140 248" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1.4"/>
    <path d="M112 236L158 352M208 236L162 352" stroke="rgba(168,80,106,.13)" stroke-width="1.2"/>
  </g>`);
  parts.push(`<g class="bow" style="--d:${t(3.7)}">
    <path d="M158 304L145 333L151 331L155 337L162 306Z" fill="#d86f8d"/>
    <path d="M162 304L175 333L169 331L165 337L158 306Z" fill="#c9607d"/>
    <path d="M160 302C147 285 127 287 129 299C131 312 150 309 160 302Z" fill="#ef9db4"/>
    <path d="M160 302C173 285 193 287 191 299C189 312 170 309 160 302Z" fill="#e6889f"/>
    <ellipse cx="160" cy="302" rx="6.5" ry="5.5" fill="#c9607d"/>
    <path d="M136 296C140 292 146 292 150 295" stroke="rgba(255,255,255,.55)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </g>`);

  // sparkles after the bloom
  const STAR = "M0 -7L1.7 -1.7L7 0L1.7 1.7L0 7L-1.7 1.7L-7 0L-1.7 -1.7Z";
  [[60, 140, 0], [262, 120, .35], [214, 62, .7], [106, 78, 1]].forEach(([x, y, d]) => {
    parts.push(`<g transform="translate(${x} ${y})"><path class="sparkle" style="--d:${t(d)}" d="${STAR}" fill="#fff8e6" stroke="#f0b7c6" stroke-width=".8"/></g>`);
  });

  const svg = `<svg viewBox="0 0 320 360" role="presentation" focusable="false">
    <defs>
      <linearGradient id="wrapL" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fbd8e0"/><stop offset="1" stop-color="#f0b2c3"/>
      </linearGradient>
      <linearGradient id="wrapR" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f6c0ce"/><stop offset="1" stop-color="#e599ae"/>
      </linearGradient>
    </defs>
    ${parts.join("")}
  </svg>`;
  $("#bouquet").innerHTML = svg;

  // stems "grow" by drawing their stroke
  const stems = [...document.querySelectorAll(".tl-stem")];
  stems.forEach(s => {
    const len = Math.ceil(s.getTotalLength ? s.getTotalLength() : 220) + 2;
    s.style.strokeDasharray = `${len}`;
    s.style.strokeDashoffset = `${len}`;
  });
  return stems;
}

/* ----------------------------------------------------------
   Opening: tulips bloom, the camera focuses, flash, then photos
   ---------------------------------------------------------- */
function fireFlash() {
  if (REDUCED) return;
  const f = $("#flash");
  f.classList.remove("fire");
  void f.offsetWidth;
  f.classList.add("fire");
  setTimeout(() => f.classList.remove("fire"), 900);
}

function runIntro() {
  const hero = $("#top");
  const af = $("#af");
  const gate = $("#gate");
  const gateBtn = $("#gateBtn");
  const stems = buildBouquet();
  $("#shots").textContent = pad(FLAT.length, 4);

  // 1) she taps "start" — that tap is what lets the song play with sound
  let begun = false;
  function begin() {
    if (begun) return;
    begun = true;
    userPaused = false;
    const playing = playMusic();                 // called inside the tap on purpose
    playing.catch(() => armTapToStart());        // fallback: next tap anywhere

    gate.classList.add("is-leaving");
    body.classList.remove("is-gate");
    setTimeout(() => { gate.hidden = true; }, REDUCED ? 0 : 950);

    // 2) the title and the camera "turn on" while the song comes in
    setTimeout(() => hero.classList.add("title-in"), REDUCED ? 0 : 450);

    // 3) let the song play on its own for a moment, then bloom
    //    (counted from when the sound actually starts, so a slow
    //     connection doesn't rush it — but never wait forever)
    const songStarted = new Promise(res => {
      if (!audio.paused && audio.currentTime > 0) return res();
      audio.addEventListener("playing", res, { once: true });
      playing.catch(res);
      setTimeout(res, 3000);
    });
    songStarted.then(() => setTimeout(bloom, REDUCED ? 0 : SETTINGS.listenBeforeBloom));
  }

  // 4) tulips grow and bloom, the camera focuses, flash, then the photos
  let bloomed = false;
  function bloom() {
    if (bloomed) return;
    bloomed = true;
    hero.classList.add("go");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      stems.forEach(s => { s.style.strokeDashoffset = "0"; });
    }));
    if (REDUCED) { reveal(); af.classList.add("done"); return; }
    setTimeout(() => af.classList.add("lock"), 4250);
    setTimeout(fireFlash, 4500);
    setTimeout(() => { reveal(); af.classList.add("done"); }, 4580);
  }

  function reveal() {
    hero.classList.add("bloomed");
    body.classList.remove("is-intro");
    body.classList.add("is-revealed");
    observeReveals();
  }

  gateBtn.addEventListener("click", begin);
  // on a computer, Enter or Space also starts it
  document.addEventListener("keydown", e => {
    if (!begun && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); begin(); }
  });
}

/* ----------------------------------------------------------
   Gallery
   ---------------------------------------------------------- */
const TILTS = [-0.7, 0.55, -0.35, 0.8, -0.55, 0.35];

function buildGallery() {
  const root = $("#gallery");
  if (!DATA.length) {
    root.append(el("p", { class: "roll__empty", text: "Photos will appear here once media/ is filled and tools/build_gallery.py has been run." }));
    return;
  }

  DATA.forEach(group => {
    const headId = `d-${group.date}`;
    const section = el("section", { class: "roll", "aria-labelledby": headId });
    const head = el("div", { class: "roll__head" });
    const stamp = el("h2", { class: "stamp", id: headId });
    stamp.innerHTML = sevenSeg(group.date) + `<span class="sr-only">${group.date}</span>`;
    head.append(stamp);

    const list = el("ul", { class: "prints" });
    group.items.forEach(item => {
      const index = FLAT.push(Object.assign({ date: group.date }, item)) - 1;
      list.append(buildPrint(FLAT[index], index));
    });

    section.append(head, list);
    root.append(section);
  });
}

function buildPrint(item, index) {
  const isVideo = item.type === "video";
  const li = el("li", { class: `print print--${item.type}` });
  li.style.setProperty("--tilt", `${TILTS[index % TILTS.length]}deg`);

  const btn = el("button", {
    class: "print__btn", type: "button",
    "aria-label": `${isVideo ? "Play video" : "Open photo"}: ${item.label}`
  });
  const media = el("span", { class: "print__media" });
  if (item.w && item.h) media.style.setProperty("--ar", `${item.w} / ${item.h}`);

  const preview = isVideo ? item.poster : (item.thumb || item.file);
  if (preview) {
    const img = el("img", { alt: "", loading: "lazy", decoding: "async", width: item.w, height: item.h });
    img.addEventListener("error", () => {
      if (!isVideo && img.dataset.fallback !== "1") { img.dataset.fallback = "1"; img.src = enc(item.file); }
      else if (isVideo) img.replaceWith(videoThumb(item));
    }, { once: false });
    img.src = enc(preview);
    media.append(img);
  } else if (isVideo) {
    media.append(videoThumb(item));
  }

  if (isVideo) {
    media.append(el("span", { class: "print__play", "aria-hidden": "true" }));
    media.lastChild.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16"><path d="M5 3.5v13L16 10z" fill="currentColor"/></svg>';
    if (item.duration) media.append(el("span", { class: "print__badge", "aria-hidden": "true", text: fmtDur(item.duration) }));
  }

  btn.append(media);
  btn.addEventListener("click", () => openViewer(index));
  li.append(btn);
  return li;
}

function videoThumb(item) {
  // used only when no cover frame was generated
  const v = el("video", { muted: true, playsinline: true, preload: "metadata", "aria-hidden": "true" });
  v.muted = true;
  v.style.cssText = "width:100%;height:100%;object-fit:cover";
  v.src = enc(item.file) + "#t=0.4";
  return v;
}

/* reveal prints as they scroll into view, each with a little flash */
let revealObs = null;
function observeReveals() {
  const targets = document.querySelectorAll(".roll__head, .print, .finale__row");
  if (REDUCED || !("IntersectionObserver" in window)) {
    targets.forEach(t => t.classList.add("is-in"));
    return;
  }
  revealObs = new IntersectionObserver(entries => {
    let n = 0;
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.setProperty("--rd", `${(n++ * 0.08).toFixed(2)}s`);
      e.target.classList.add("is-in");
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
  targets.forEach(t => revealObs.observe(t));
}

/* ----------------------------------------------------------
   Background music
   ---------------------------------------------------------- */
const audio = $("#bgm");
const playBtn = $("#playBtn");
const muteBtn = $("#muteBtn");
const prompt = $("#musicPrompt");
let musicStarted = false;   // has it ever actually played
let userPaused = false;     // she pressed pause herself
let pausedForVideo = false; // we paused it so a video's sound can be heard

function updateMusicUI() {
  const playing = !audio.paused;
  body.classList.toggle("is-playing", playing);
  body.classList.toggle("is-muted", audio.muted);
  playBtn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
  muteBtn.setAttribute("aria-label", audio.muted ? "Unmute music" : "Mute music");
  muteBtn.setAttribute("aria-pressed", String(audio.muted));
}

function showPrompt() {
  if (musicStarted || userPaused) return;
  body.classList.add("music-waiting");
  if (window.scrollY < 260) prompt.hidden = false;
}
function hidePrompt() { prompt.hidden = true; body.classList.remove("music-waiting"); }
// once she starts scrolling through the photos, tuck the big hint away
// (the play button keeps glowing, and any tap still starts the song)
window.addEventListener("scroll", () => {
  if (!prompt.hidden && window.scrollY > 260) prompt.hidden = true;
}, { passive: true });

function playMusic() {
  let p;
  try { p = audio.play(); } catch (err) { p = Promise.reject(err); }
  if (!p || !p.then) { musicStarted = true; hidePrompt(); return Promise.resolve(); }
  return p.then(() => { musicStarted = true; hidePrompt(); })
    .catch(err => {
      if (err && err.name === "NotAllowedError") showPrompt();
      else console.warn("[music] couldn't play", SETTINGS.song, err);
      throw err;
    });
}

function initMusic() {
  $("#songTitle").textContent = SETTINGS.songTitle;
  audio.src = enc(SETTINGS.song);
  ["play", "pause", "volumechange"].forEach(t => audio.addEventListener(t, updateMusicUI));
  updateMusicUI();

  playBtn.addEventListener("click", () => {
    if (audio.paused) { userPaused = false; pausedForVideo = false; playMusic().catch(() => {}); }
    else { userPaused = true; audio.pause(); hidePrompt(); }
  });
  muteBtn.addEventListener("click", () => { audio.muted = !audio.muted; });
  prompt.addEventListener("click", () => { userPaused = false; playMusic().catch(() => {}); });

  if ("mediaSession" in navigator) {
    try {
      if ("MediaMetadata" in window) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: SETTINGS.songTitle, album: "For Beem" });
      }
      navigator.mediaSession.setActionHandler("play", () => { userPaused = false; playMusic().catch(() => {}); });
      navigator.mediaSession.setActionHandler("pause", () => { userPaused = true; audio.pause(); });
    } catch (_) { /* not supported */ }
  }

  // The song starts from the "tap to start" screen (see runIntro).
}

// Fallback only: if a browser still refuses after that tap,
// the next tap anywhere starts it.
function armTapToStart() {
  const types = ["click", "touchend", "keydown"];
  const handler = e => {
    if (musicStarted || userPaused) return cleanup();
    if (e.target && e.target.closest && e.target.closest("#playBtn, #muteBtn, #musicPrompt")) return;
    if (viewerVideoHasSound()) return;
    playMusic().then(cleanup).catch(() => {});
  };
  const cleanup = () => types.forEach(t => document.removeEventListener(t, handler, true));
  types.forEach(t => document.addEventListener(t, handler, true));
}

/* ----------------------------------------------------------
   Viewer (the camera's playback screen)
   ---------------------------------------------------------- */
const viewer = $("#playback");
const stage = $("#pbStage");
let current = 0;
let lastFocus = null;
let stageVideo = null;

function viewerVideoHasSound() {
  return !!(stageVideo && !stageVideo.paused && FLAT[current] && FLAT[current].audio !== false);
}

function openViewer(index) {
  lastFocus = document.activeElement;
  current = index;
  viewer.hidden = false;
  document.documentElement.classList.add("no-scroll");
  renderSlide(true);
  $("#pbClose").focus({ preventScroll: true });
}

function closeViewer() {
  stopStageVideo();
  viewer.hidden = true;
  stage.textContent = "";
  document.documentElement.classList.remove("no-scroll");
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}

function stopStageVideo() {
  if (!stageVideo) return;
  stageVideo.pause();
  stageVideo.removeAttribute("src");
  try { stageVideo.load(); } catch (_) {}
  stageVideo = null;
  resumeAfterVideo();
}

function pauseForVideo(item, v) {
  if (item.audio === false || v.muted) return;      // silent clip: the song keeps playing
  if (!audio.paused) { pausedForVideo = true; audio.pause(); }
}
function resumeAfterVideo() {
  if (pausedForVideo && !userPaused) { pausedForVideo = false; playMusic().catch(() => {}); }
  else pausedForVideo = false;
}

function renderSlide(autoplay) {
  const item = FLAT[current];
  if (!item) return;
  stopStageVideo();
  stage.textContent = "";

  if (item.type === "video") {
    const v = el("video", { controls: true, playsinline: true, preload: "auto" });
    v.playsInline = true;
    if (item.poster) v.poster = enc(item.poster);
    v.src = enc(item.file);
    v.setAttribute("aria-label", `Video: ${item.label}`);
    v.addEventListener("play", () => pauseForVideo(item, v));
    v.addEventListener("pause", resumeAfterVideo);
    v.addEventListener("ended", resumeAfterVideo);
    stage.append(v);
    stageVideo = v;
    if (autoplay !== false) {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    }
  } else {
    const img = el("img", { alt: item.label, decoding: "async" });
    const full = enc(item.file);
    if (item.thumb) {
      img.src = enc(item.thumb);            // instant preview…
      const hi = new Image();               // …then the sharp original
      hi.onload = () => { if (FLAT[current] === item) img.src = full; };
      hi.src = full;
    } else {
      img.src = full;
    }
    stage.append(img);
  }

  $("#pbCount").textContent = `${pad(current + 1)}/${pad(FLAT.length)}`;
  $("#pbDate").innerHTML = sevenSeg(item.date) + `<span class="sr-only">${item.date}</span>`;

  // warm up the next photo
  const next = FLAT[(current + 1) % FLAT.length];
  if (next && next.type === "photo") { const pre = new Image(); pre.src = enc(next.file); }
}

function step(dir) {
  current = (current + dir + FLAT.length) % FLAT.length;
  renderSlide(true);
}

function initViewer() {
  $("#pbClose").addEventListener("click", closeViewer);
  $("#pbPrev").addEventListener("click", () => step(-1));
  $("#pbNext").addEventListener("click", () => step(1));

  // swipe between photos
  let sx = 0, sy = 0, tracking = false;
  stage.addEventListener("touchstart", e => {
    if (e.touches.length !== 1 || (FLAT[current] && FLAT[current].type === "video")) { tracking = false; return; }
    tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // tap the dark area around a photo to close
  stage.addEventListener("click", e => { if (e.target === stage) closeViewer(); });

  document.addEventListener("keydown", e => {
    if (viewer.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeViewer(); }
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Tab") trapFocus(e, viewer);
  });
}

function trapFocus(e, root) {
  const f = [...root.querySelectorAll("button, [href], video[controls], [tabindex]:not([tabindex='-1'])")]
    .filter(n => !n.hidden && n.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ----------------------------------------------------------
   The letter
   ---------------------------------------------------------- */
function probe(url) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => res(im.naturalWidth > 0 ? { url, w: im.naturalWidth, h: im.naturalHeight } : null);
    im.onerror = () => res(null);
    im.src = url;
  });
}

async function findLetterPages() {
  const pages = [];
  let ext = null;
  for (const e of SETTINGS.letterExts) {
    const hit = await probe(enc(`${SETTINGS.letterBase}.${e}`));
    if (hit) { pages.push(hit); ext = e; break; }
  }
  if (!ext) {
    console.info("[letter] No scan found yet — save it as letter/letter.jpg (see README.md).");
    return pages;
  }
  for (let n = 2; n <= SETTINGS.maxLetterPages; n++) {
    const hit = await probe(enc(`${SETTINGS.letterBase}-${n}.${ext}`));
    if (!hit) break;
    pages.push(hit);
  }
  return pages;
}

function initLetter() {
  const wrap = $("#envWrap");
  const envelope = $("#envelope");
  const row = $("#finaleRow");
  const letter = $("#letter");
  const pagesReady = findLetterPages();
  let opened = false;

  pagesReady.then(pages => {
    if (!pages.length) return;
    const pv = $("#envPreview");
    pv.src = pages[0].url;
    pv.hidden = false;
  });

  envelope.addEventListener("click", async () => {
    if (opened) return;
    opened = true;
    envelope.setAttribute("aria-expanded", "true");
    envelope.setAttribute("aria-label", "Opening the envelope");

    const T = REDUCED ? { flap: 60, pull: 60, leave: 40 } : { flap: 950, pull: 1150, leave: 480 };
    wrap.classList.add("is-opening");            // seal lifts, flap swings open
    await wait(T.flap);
    wrap.classList.add("flap-back");             // flap tucks behind the paper
    await wait(60);
    wrap.classList.add("is-pulling");            // the letter slides out
    await wait(T.pull);
    const pages = await pagesReady;
    wrap.classList.add("is-leaving");            // envelope softly falls away
    await wait(T.leave);

    row.classList.add("is-open");
    renderLetter(pages);
    letter.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => letter.classList.add("is-settled")));
    row.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  });
}

let LETTER_PAGES = [];
function renderLetter(pages) {
  LETTER_PAGES = pages;
  const holder = $("#letterPages");
  holder.textContent = "";
  if (!pages.length) {
    $("#letterPlaceholder").hidden = false;
    return;
  }
  pages.forEach((p, i) => {
    const label = pages.length > 1 ? `page ${i + 1} of ${pages.length}` : "";
    const btn = el("button", { class: "letter__page", type: "button", "aria-label": `Zoom into the letter${label ? ", " + label : ""}` });
    btn.append(el("img", { src: p.url, width: p.w, height: p.h, alt: `Scanned handwritten letter${label ? ", " + label : ""}` }));
    btn.addEventListener("click", () => openZoom(i));
    holder.append(btn);
  });
  const links = $("#letterLinks");
  links.textContent = "";
  pages.forEach((p, i) => {
    links.append(el("a", {
      class: "pill pill--ghost", href: p.url, target: "_blank", rel: "noopener",
      text: pages.length > 1 ? `Page ${i + 1} full size ↗` : "Open full size ↗"
    }));
  });
  $("#zoomOpen").onclick = () => openZoom(0);
  $("#letterTools").hidden = false;
}

/* ----------------------------------------------------------
   Letter zoom (buttons, pinch, double-tap)
   ---------------------------------------------------------- */
const zoomer = $("#zoomer");
const zScroll = $("#zoomScroll");
const zInner = $("#zoomInner");
const Z = { z: 1, min: 1, max: 5 };
let zoomLastFocus = null;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const zoomBase = () => Math.min(zScroll.clientWidth - 16, 980);

function setZoom(z, fx, fy) {
  z = clamp(z, Z.min, Z.max);
  if (fx == null) { fx = zScroll.clientWidth / 2; fy = zScroll.clientHeight / 2; }
  const oldW = zInner.offsetWidth || 1, oldH = zInner.offsetHeight || 1;
  const cx = (zScroll.scrollLeft + fx - zInner.offsetLeft) / oldW;
  const cy = (zScroll.scrollTop + fy - zInner.offsetTop) / oldH;
  Z.z = z;
  zInner.style.width = `${Math.round(zoomBase() * z)}px`;
  zScroll.scrollLeft = cx * zInner.offsetWidth + zInner.offsetLeft - fx;
  zScroll.scrollTop = cy * zInner.offsetHeight + zInner.offsetTop - fy;
  $("#zoomLevel").textContent = `${Math.round(z * 100)}%`;
}

function openZoom(pageIndex) {
  if (!LETTER_PAGES.length) return;
  zoomLastFocus = document.activeElement;
  zInner.textContent = "";
  LETTER_PAGES.forEach((p, i) => zInner.append(el("img", {
    src: p.url, width: p.w, height: p.h, draggable: "false",
    alt: `Scanned handwritten letter${LETTER_PAGES.length > 1 ? `, page ${i + 1}` : ""}`
  })));
  zoomer.hidden = false;
  document.documentElement.classList.add("no-scroll");
  Z.z = 1;
  zInner.style.width = `${zoomBase()}px`;
  $("#zoomLevel").textContent = "100%";
  const target = zInner.children[pageIndex || 0];
  zScroll.scrollTop = target ? target.offsetTop - 14 : 0;
  zScroll.scrollLeft = 0;
  $("#zoomClose").focus({ preventScroll: true });
}

function closeZoom() {
  zoomer.hidden = true;
  zInner.textContent = "";
  document.documentElement.classList.remove("no-scroll");
  if (zoomLastFocus && zoomLastFocus.focus) zoomLastFocus.focus({ preventScroll: true });
}

function initZoom() {
  $("#zoomIn").addEventListener("click", () => setZoom(Z.z * 1.5));
  $("#zoomOut").addEventListener("click", () => setZoom(Z.z / 1.5));
  $("#zoomFit").addEventListener("click", () => setZoom(1));
  $("#zoomClose").addEventListener("click", closeZoom);

  const local = t => {
    const r = zScroll.getBoundingClientRect();
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  let pinch = null, tap = { t: 0, x: 0, y: 0 }, moved = false, sx = 0, sy = 0;
  zScroll.addEventListener("touchstart", e => {
    if (e.touches.length === 2) {
      pinch = { d: dist(e.touches[0], e.touches[1]), z: Z.z };
    } else if (e.touches.length === 1) {
      moved = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }
  }, { passive: true });
  zScroll.addEventListener("touchmove", e => {
    if (pinch && e.touches.length === 2) {
      e.preventDefault();
      const a = e.touches[0], b = e.touches[1];
      const m = local({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 });
      setZoom(pinch.z * dist(a, b) / pinch.d, m.x, m.y);
    } else if (e.touches.length === 1) {
      if (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8) moved = true;
    }
  }, { passive: false });
  zScroll.addEventListener("touchend", e => {
    if (e.touches.length < 2) pinch = null;
    if (e.touches.length || moved || e.changedTouches.length !== 1) return;
    const t = e.changedTouches[0], now = Date.now();
    if (now - tap.t < 320 && Math.abs(t.clientX - tap.x) < 30 && Math.abs(t.clientY - tap.y) < 30) {
      e.preventDefault();
      const p = local(t);
      setZoom(Z.z > 1.2 ? 1 : 2.5, p.x, p.y);
      tap.t = 0;
    } else {
      tap = { t: now, x: t.clientX, y: t.clientY };
    }
  }, { passive: false });
  zScroll.addEventListener("dblclick", e => {
    const p = local(e);
    setZoom(Z.z > 1.2 ? 1 : 2.5, p.x, p.y);
  });
  // keep Safari's own page zoom out of the way while the zoom view is open
  ["gesturestart", "gesturechange"].forEach(t =>
    document.addEventListener(t, e => { if (!zoomer.hidden) e.preventDefault(); }, { passive: false }));

  document.addEventListener("keydown", e => {
    if (zoomer.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeZoom(); }
    else if (e.key === "+" || e.key === "=") setZoom(Z.z * 1.5);
    else if (e.key === "-") setZoom(Z.z / 1.5);
    else if (e.key === "Tab") trapFocus(e, zoomer);
  });
  window.addEventListener("resize", () => { if (!zoomer.hidden) setZoom(Z.z); });
}

/* ----------------------------------------------------------
   Start
   ---------------------------------------------------------- */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

buildGallery();
initViewer();
initLetter();
initZoom();
initMusic();
runIntro();
