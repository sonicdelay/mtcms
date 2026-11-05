(() => {
  "use strict";

  const JINA_PREFIX = "https://r.jina.ai/";
  const JINA_INTERVAL = 3300; // stay below the free reader limit (20 req/min)
  const TAPE_RE = /\/tape-(\d+)-(\d+)-(\d+)\.html$/;
  const IMGSRC_RE = /(^|\.)imgsrc\.ru$/i;
  const DEFAULT_PROXY_ORIGIN = "http://localhost:8787";
  // Empty when the page is served by cors-proxy.mjs itself; otherwise the
  // absolute origin of the proxy (e.g. when index.html was opened from disk
  // or from another local static server).
  let proxyOrigin = "";
  let galleryAssets = null;

  const isHttpPage = () => /^https?:$/.test(location.protocol);
  const proxyUrl = (path) =>
    proxyOrigin ? `${proxyOrigin}${path}` : `.${path}`;
  const assetUrl = (file) =>
    proxyOrigin ? `${proxyOrigin}/${file}` : `./${file}`;

  function loadGalleryAssets() {
    if (!galleryAssets) {
      const fetchAsset = (file, name) =>
        fetch(assetUrl(file))
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Could not load ${name} (${response.status}).`);
            }
            return response.text();
          })
          .catch((error) => {
            if (error instanceof TypeError) {
              throw new Error(
                `Could not load ${name}. Start the local proxy (node cors-proxy.mjs) to export the standalone page.`
              );
            }
            throw error;
          });

      galleryAssets = Promise.all([
        fetchAsset("gallery.css", "gallery.css"),
        fetchAsset("lightbox.js", "lightbox.js")
      ])
        .then(([css, lightbox]) => ({ css, lightbox }))
        .catch((error) => {
          galleryAssets = null;
          throw error;
        });
    }
    return galleryAssets;
  }

  // One entry per photo. When the same photo is offered in several
  // formats, the highest-ranked variant wins; WEBP is preferred.
  const FORMAT_RANK = {
    webp: 100,
    gif: 90,
    avif: 80,
    png: 70,
    tiff: 60,
    jpg: 10
  };
  const formatRank = (ext) => FORMAT_RANK[ext] ?? 50;
  const EXT_ALIASES = {
    jpeg: "jpg",
    jpe: "jpg",
    jfif: "jpg",
    tif: "tiff",
    "svg+xml": "svg",
    "x-icon": "ico"
  };
  const MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/pjpeg": "jpg",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico"
  };
  const BASE_TITLE = "iMGSRC.RU album → image gallery";
  const STORAGE_KEY = "imgsrc:lastAlbum";

  const $ = (selector) => document.querySelector(selector);
  const form = $("#scrape-form");
  const urlInput = $("#album-url");
  const limitInput = $("#max-images");
  const backendSelect = $("#backend");
  const jinaKeyInput = $("#jina-key");
  const startButton = $("#start");
  const cancelButton = $("#cancel");
  const progressWrap = $("#progress-wrap");
  const progressBar = $("#progress-bar");
  const statusEl = $("#status");
  const counterEl = $("#counter");
  const alertEl = $("#alert");
  const results = $("#results");
  const resultsTitle = $("#results-title");
  const resultsMeta = $("#results-meta");
  const grid = $("#grid");
  const copyButton = $("#copy");
  const openSourceButton = $("#open-source");

  const LIGHTBOX_MARKUP = `
<div id="lb" role="dialog" aria-modal="true" aria-label="Image viewer">
<img alt="">
<div class="bar">
  <button type="button" data-nav="-1">← Prev</button>
  <span id="lb-count"></span>
  <button type="button" data-nav="1">Next →</button>
  <button type="button" data-close>Close</button>
</div>
</div>`;

  $("#lb-host").innerHTML = LIGHTBOX_MARKUP;

  let current = null; // { images, title, sourceUrl }
  let abortController = null;
  let proxyAvailable = false;
  let lastJinaRequest = 0;

  /* ---------------------------------------------------------------- helpers */

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true }
      );
    });

  const galleryTitle = (album) => `${album} — iMGSRC.RU image gallery`;

  function slugify(value) {
    return (
      String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "imgsrc-album"
    );
  }

  function rememberAlbum({ images, title, sourceUrl }) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          title,
          sourceUrl,
          count: images.length,
          savedAt: new Date().toISOString()
        })
      );
    } catch {
      // localStorage may be unavailable (private mode, some file:// setups).
    }
  }

  function normalizeUrl(raw) {
    let value = String(raw || "").trim();
    if (!value) throw new Error("Enter an album URL first.");
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

    const url = new URL(value);
    if (!IMGSRC_RE.test(url.hostname)) {
      throw new Error("Only iMGSRC.RU URLs are supported.");
    }
    url.hash = "";
    return url.toString();
  }

  const absoluteUrl = (src) => {
    if (!src) return null;
    if (src.startsWith("//")) return `https:${src}`;
    if (/^https?:\/\//i.test(src)) return src;
    return new URL(src, "https://imgsrc.ru/").toString();
  };

  // <source srcset> may carry multiple candidates ("url 1x, url 2x").
  const srcsetUrls = (srcset) =>
    String(srcset || "")
      .split(",")
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean);

  // Normalizes a file extension or MIME subtype ("jpeg" → "jpg").
  const normalizeExt = (value) => {
    const ext = String(value || "")
      .toLowerCase()
      .replace(/^\./, "");
    return EXT_ALIASES[ext] || ext || null;
  };

  // <source type="image/…"> → internal format name. Accepts every
  // image MIME type, so new formats are collected automatically.
  const mimeToExt = (type) => {
    const mime = String(type || "")
      .toLowerCase()
      .split(";")[0]
      .trim();
    if (!mime.startsWith("image/")) return null;
    return MIME_TO_EXT[mime] || normalizeExt(mime.slice("image/".length));
  };

  // Derives the internal format ("webp" | "gif" | "png" | "jpg" | …)
  // from a URL, normalizing the JPEG and TIFF variants.
  const imageExtOf = (url) => {
    try {
      const file = decodeURIComponent(
        new URL(url).pathname.split("/").pop() || ""
      ).toLowerCase();
      const dot = file.lastIndexOf(".");
      if (dot < 0) return null;
      const ext = normalizeExt(file.slice(dot + 1));
      return ext && /^[a-z0-9]+$/.test(ext) ? ext : null;
    } catch {
      return null;
    }
  };

  // Dedupe key: one key per photo, ignoring the file extension. iMGSRC
  // names the variants of a photo after the same base file
  // (imgsrc.ru_<photoId><hash>.webp / .jpg / …), so the extension-less
  // path identifies the different formats of the same image.
  const photoKeyOf = (url) => {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname.replace(/\.[a-z0-9]+$/i, "")}${parsed.search}`;
    } catch {
      return String(url);
    }
  };

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function setProgress(done, total, count) {
    const percent = total ? Math.min(100, (done / total) * 100) : 0;
    progressBar.style.width = `${percent}%`;
    counterEl.textContent = `${done} / ${total} page${total === 1 ? "" : "s"} · ${count} image${count === 1 ? "" : "s"}`;
  }

  function showAlert(message, kind = "error") {
    alertEl.textContent = message;
    alertEl.className = `alert on ${kind}`;
  }

  function hideAlert() {
    alertEl.className = "alert";
    alertEl.textContent = "";
  }

  function setBusy(busy) {
    startButton.disabled = busy;
    startButton.textContent = busy ? "Collecting…" : "Collect images";
    cancelButton.hidden = !busy;
    progressWrap.classList.toggle("on", busy);
    if (!busy) progressBar.style.width = "0%";
  }

  /* ---------------------------------------------------------------- fetching */

  const chosenBackend = () => {
    const value = backendSelect.value;
    if (value === "auto") return proxyAvailable ? "proxy" : "jina";
    return value;
  };

  async function detectProxy() {
    const candidates = [];
    if (isHttpPage()) candidates.push(location.origin);
    // A page opened from disk (origin "null") or served by another static
    // server can still use the proxy: it sends CORS headers, so a cross-origin
    // request is allowed. Plain http is skipped on an https page because the
    // browser blocks it as mixed content before CORS is even considered.
    if (location.protocol !== "https:") {
      candidates.push(DEFAULT_PROXY_ORIGIN);
    }

    for (const base of new Set(candidates)) {
      try {
        const response = await fetch(`${base}/proxy?ping=1`, {
          cache: "no-store"
        });
        if (!response.ok) continue;
        const data = await response.json();
        if (!data?.ok) continue;
        proxyOrigin = base === location.origin ? "" : base;
        return true;
      } catch {
        // Try the next candidate.
      }
    }
    proxyOrigin = "";
    return false;
  }

  async function fetchViaProxy(url, signal) {
    const response = await fetch(
      proxyUrl(`/proxy?url=${encodeURIComponent(url)}`),
      {
        signal,
        cache: "no-store"
      }
    );
    if (!response.ok) {
      throw new Error(
        `Local proxy returned HTTP ${response.status}. Is cors-proxy.mjs running?`
      );
    }
    return response.text();
  }

  async function fetchViaJina(url, signal) {
    const headers = {
      "X-Return-Format": "html",
      // iMGSRC.RU puts adult albums behind a one-click “over 18” page
      // and remembers the answer in this cookie. Forward it so the
      // reader returns the album instead of the warning page.
      "X-Set-Cookie": "over18=yeah"
    };
    const key = jinaKeyInput.value.trim();
    if (key) headers.Authorization = `Bearer ${key}`;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const wait = lastJinaRequest + JINA_INTERVAL - Date.now();
      if (wait > 0) {
        setStatus(
          `Waiting ${Math.ceil(wait / 1000)}s for the reader rate limit…`
        );
        await sleep(wait, signal);
      }
      lastJinaRequest = Date.now();

      let response;
      try {
        response = await fetch(JINA_PREFIX + url, { headers, signal });
      } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new Error(
          `Could not reach r.jina.ai (${error.message}). ` +
            "Try the local proxy: run “node cors-proxy.mjs” and open http://localhost:8787."
        );
      }

      if (response.status === 429) {
        const retryAfter = Number.parseInt(
          response.headers.get("retry-after") || "",
          10
        );
        const seconds =
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 20;
        setStatus(`Reader rate limit hit — retrying in ${seconds}s…`);
        await sleep(seconds * 1000, signal);
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Reader returned HTTP ${response.status} ${response.statusText}.`
        );
      }

      return response.text();
    }

    throw new Error(
      "The reader rate limit was hit repeatedly. Add a Jina API key, or use the local proxy."
    );
  }

  const fetchHtml = (url, signal) =>
    chosenBackend() === "proxy"
      ? fetchViaProxy(url, signal)
      : fetchViaJina(url, signal);

  /* ---------------------------------------------------------------- parsing */

  const parseDoc = (html) => new DOMParser().parseFromString(html, "text/html");

  function tapeInfo(url) {
    const match = new URL(url).pathname.match(TAPE_RE);
    if (!match) return null;
    return { album: match[1], first: match[2], offset: Number(match[3]) };
  }

  /** Tape URL → the album's initial view (its first photo page). */
  function initialViewUrl(url) {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^(.*)\/tape-\d+-(\d+)-\d+\.html$/);
    if (!match) return url;
    parsed.pathname = `${match[1]}/${match[2]}.html`;
    parsed.hash = "";
    return parsed.toString();
  }

  /**
   * iMGSRC.RU may show a “foreword” page before an album
   * (…?preword=show). It carries a GET form named “preword” whose submit
   * button continues to the album. Returns the URL to follow, or null.
   */
  function prewordContinueUrl(doc, currentUrl) {
    const form = doc.querySelector("form[name='preword']");
    if (!form) return null;

    let url;
    try {
      url = new URL(form.getAttribute("action") || currentUrl, currentUrl);
    } catch {
      return null;
    }

    const params = new URLSearchParams(url.search);
    for (const field of form.querySelectorAll(
      "input[name], select[name], textarea[name]"
    )) {
      const name = field.getAttribute("name");
      const type = (field.getAttribute("type") || "").toLowerCase();
      if (!name || field.disabled) continue;
      if (type === "submit" || type === "button" || type === "image") continue;
      if (
        (type === "checkbox" || type === "radio") &&
        !field.hasAttribute("checked")
      ) {
        continue;
      }
      params.set(name, field.value ?? "");
    }

    // Keep the album password when the form itself dropped it.
    const pwd = new URL(currentUrl).searchParams.get("pwd");
    if (pwd && !params.has("pwd")) params.set("pwd", pwd);

    // The album lives at the same URL without the preword flag.
    params.delete("preword");
    url.search = params.toString();
    url.hash = "";
    return url.toString();
  }

  /** Fetches a page and transparently follows a “foreword” page. */
  async function fetchDoc(url, signal) {
    let doc = parseDoc(await fetchHtml(url, signal));
    const continueUrl = prewordContinueUrl(doc, url);
    if (!continueUrl) return { doc, url };

    setStatus("Skipping the album foreword…");
    doc = parseDoc(await fetchHtml(continueUrl, signal));
    return { doc, url: continueUrl };
  }

  function findTapeHref(doc, currentUrl) {
    const current = new URL(currentUrl);
    const userPrefix = current.pathname.replace(/\/[^/]*$/, "/");

    for (const anchor of doc.querySelectorAll("a[href]")) {
      const candidate = absoluteUrl(anchor.getAttribute("href"));
      if (!candidate) continue;

      const url = new URL(candidate);
      if (!/\/tape-\d+-\d+-\d+\.html$/.test(url.pathname)) continue;
      if (!url.pathname.startsWith(userPrefix)) continue;

      // Keep the album password when the link itself dropped it.
      if (current.searchParams.get("pwd") && !url.searchParams.has("pwd")) {
        url.searchParams.set("pwd", current.searchParams.get("pwd"));
      }
      url.hash = "";
      return url.toString();
    }
    return null;
  }

  function tapeOffsets(doc, url) {
    const info = tapeInfo(url);
    if (!info) return [];

    const offsets = new Set([info.offset]);
    for (const anchor of doc.querySelectorAll("a[href]")) {
      const candidate = absoluteUrl(anchor.getAttribute("href"));
      if (!candidate) continue;
      const match = new URL(candidate).pathname.match(TAPE_RE);
      if (match && match[1] === info.album && match[2] === info.first) {
        offsets.add(Number(match[3]));
      }
    }
    return [...offsets].sort((a, b) => a - b);
  }

  function tapeUrlForOffset(baseUrl, offset) {
    const url = new URL(baseUrl);
    url.pathname = url.pathname.replace(/-\d+\.html$/, `-${offset}.html`);
    return url.toString();
  }

  function nextTapeUrl(doc, currentUrl) {
    const info = tapeInfo(currentUrl);
    if (!info) return null;

    let best = null;
    for (const anchor of doc.querySelectorAll("a[href]")) {
      const candidate = absoluteUrl(anchor.getAttribute("href"));
      if (!candidate) continue;
      const match = new URL(candidate).pathname.match(TAPE_RE);
      if (!match || match[1] !== info.album || match[2] !== info.first)
        continue;

      const offset = Number(match[3]);
      if (offset <= info.offset) continue;
      if (!best || offset < best.offset) best = { offset, url: candidate };
    }

    if (!best) return null;

    // Keep the album password when the link itself dropped it.
    const result = new URL(best.url);
    const pwd = new URL(currentUrl).searchParams.get("pwd");
    if (pwd && !result.searchParams.has("pwd"))
      result.searchParams.set("pwd", pwd);
    result.hash = "";
    return result.toString();
  }

  function extractImages(doc) {
    const out = [];

    const captionOf = (element) => {
      const container = element.closest("div");
      if (!container) return "";
      const clone = container.cloneNode(true);
      clone
        .querySelectorAll("picture, a, br, i, span")
        .forEach((node) => node.remove());
      const text = (clone.textContent || "").replace(/\s+/g, " ").trim();
      return text.split("©")[0].trim();
    };

    const push = (url, caption, width, height, ext) => {
      const absolute = absoluteUrl(url);
      if (!absolute) return;
      out.push({
        url: absolute,
        caption,
        width,
        height,
        ext,
        key: photoKeyOf(absolute)
      });
    };

    const handleSource = (source, caption, width, height) => {
      const declaredExt = mimeToExt(source.getAttribute("type"));

      const srcset =
        source.getAttribute("srcset") || source.getAttribute("src") || "";
      for (const url of srcsetUrls(srcset)) {
        // Full-size files are named imgsrc.ru_<photoId><hash>.<ext>;
        // navigation thumbnails do not carry the "imgsrc.ru_" prefix.
        if (!/imgsrc\.ru_\d+/.test(url)) continue;
        const fullUrl = absoluteUrl(url);
        if (!fullUrl) continue;
        const ext = imageExtOf(fullUrl) || declaredExt;
        if (!ext) continue;
        push(fullUrl, caption, width, height, ext);
      }
    };

    // Full-size sources of every <picture> element — animated GIFs arrive
    // as image/gif sources, static photos as image/webp and image/jpeg,
    // and any other format is picked up the same way.
    for (const picture of doc.querySelectorAll("picture")) {
      const img = picture.querySelector("img");
      const width = img?.getAttribute("width") || null;
      const height = img?.getAttribute("height") || null;
      for (const source of picture.querySelectorAll("source")) {
        handleSource(source, captionOf(picture), width, height);
      }
    }

    // Full-size images that are plain <img> sources (e.g. animated GIFs).
    for (const img of doc.querySelectorAll("img")) {
      const url = absoluteUrl(img.getAttribute("src") || "");
      const ext = url ? imageExtOf(url) : null;
      if (!url || !ext) continue;
      // Skip placeholders (e.g. /images/1.gif) and navigation thumbnails.
      if (!/imgsrc\.ru_\d+/.test(url)) continue;
      push(
        url,
        captionOf(img),
        img.getAttribute("width") || null,
        img.getAttribute("height") || null,
        ext
      );
    }

    // On single-photo pages the full-size URL can sit in an inline
    // onclick handler (animated GIFs, and occasionally other formats).
    for (const element of doc.querySelectorAll("[onclick]")) {
      const onclick = element.getAttribute("onclick") || "";
      for (const match of onclick.matchAll(/['"]([^'"]+)['"]/g)) {
        const url = match[1];
        if (!/imgsrc\.ru_\d+/.test(url)) continue;
        const fullUrl = absoluteUrl(url);
        if (!fullUrl) continue;
        const ext = imageExtOf(fullUrl);
        if (!ext) continue;

        const big = element.querySelector("img.big");
        const name = doc.getElementById("photo_name")?.textContent?.trim();
        push(
          fullUrl,
          name || captionOf(element),
          big?.getAttribute("width") || null,
          big?.getAttribute("height") || null,
          ext
        );
      }
    }

    return out;
  }

  function addImages(doc, map, limit) {
    for (const image of extractImages(doc)) {
      const existing = map.get(image.key);
      if (existing) {
        // Same photo in another format: keep the preferred variant
        // (WEBP before GIF/AVIF/PNG before the JPG fallback).
        if (formatRank(image.ext) > formatRank(existing.ext)) {
          map.set(image.key, image);
        }
        continue;
      }
      if (map.size >= limit) break;
      map.set(image.key, image);
    }
    return map.size;
  }

  function albumTitle(pageTitle, fallback) {
    const cleaned = String(pageTitle || "")
      .replace(/\s*@iMGSRC\.RU\s*$/i, "")
      .trim();
    if (!cleaned) return fallback;
    return cleaned.split(" / ")[0].trim() || cleaned;
  }

  const fileName = (url) => {
    try {
      return decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    } catch {
      return url;
    }
  };

  // Human-readable list of the formats present in a result set.
  const formatSummary = (images) => {
    const formats = [...new Set(images.map((image) => image.ext))]
      .filter(Boolean)
      .map((ext) => ext.toUpperCase())
      .sort();
    return formats.length ? `formats: ${formats.join(", ")}` : "";
  };

  /* ---------------------------------------------------------------- rendering */

  function cardsHtml(images) {
    return images
      .map((image, index) => {
        const label = image.caption || fileName(image.url);
        const dims =
          image.width && image.height ? `${image.width} × ${image.height}` : "";
        return `      <figure class="card">
  <a class="frame" href="${escapeHtml(image.url)}" target="_blank" rel="noopener">
    <img src="${escapeHtml(image.url)}" alt="${escapeHtml(label)}" loading="lazy" decoding="async">
  </a>
  <figcaption>
    <span class="idx">${index + 1}</span>
    <span class="name" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
    ${dims ? `<span class="dims">${escapeHtml(dims)}</span>` : ""}
  </figcaption>
</figure>`;
      })
      .join("\n");
  }

  function renderResults({ images, title, sourceUrl }) {
    current = { images, title, sourceUrl };

    resultsTitle.textContent = title;
    document.title = galleryTitle(title);
    rememberAlbum({ images, title, sourceUrl });
    const formats = formatSummary(images);
    resultsMeta.innerHTML =
      `${images.length} image${images.length === 1 ? "" : "s"}${formats ? ` · ${formats}` : ""} · ` +
      `source: <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(sourceUrl)}</a>`;
    grid.innerHTML = cardsHtml(images);
    results.classList.add("on");
    openSourceButton.dataset.url = sourceUrl;
  }

  async function buildStandaloneHtml() {
    if (!current) return "";
    const { css, lightbox } = await loadGalleryAssets();
    const generated =
      new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
    const formats = formatSummary(current.images);

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(galleryTitle(current.title))}</title>
<meta name="album" content="${escapeHtml(current.title)}">
<meta name="source" content="${escapeHtml(current.sourceUrl)}">
<meta name="generator" content="iMGSRC.RU browser collector">
<style>
:root {
color-scheme: dark;
--bg: #0f1115;
--panel: #171a21;
--line: #262b36;
--text: #e6e9ef;
--muted: #8b93a7;
--accent: #7aa2f7;
}
* { box-sizing: border-box; }
body {
margin: 0;
padding: 24px clamp(12px, 3vw, 48px) 64px;
background: var(--bg);
color: var(--text);
font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
header { margin-bottom: 28px; }
h1 { margin: 0 0 6px; font-size: clamp(20px, 2.6vw, 30px); font-weight: 650; }
.meta { color: var(--muted); font-size: 13px; overflow-wrap: anywhere; }
.meta a { color: var(--accent); }
footer { margin-top: 32px; color: var(--muted); font-size: 12px; }
${css}
</style>
</head>
<body>
<header>
<h1>${escapeHtml(current.title)}</h1>
<div class="meta">
${current.images.length} image${current.images.length === 1 ? "" : "s"}${formats ? ` · ${formats}` : ""} ·
source: <a href="${escapeHtml(current.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(current.sourceUrl)}</a><br>
generated ${escapeHtml(generated)} with the iMGSRC.RU browser collector
</div>
</header>

<main class="grid">
${cardsHtml(current.images)}
</main>

<footer>Click an image to view it full size. Use ← / → to move, Esc to close.</footer>

${LIGHTBOX_MARKUP}
<script>${lightbox}<\/script>
</body>
</html>
`;
  }

  /* ---------------------------------------------------------------- workflow */

  async function collect(startUrl, limit, signal) {
    const images = new Map();

    // Start at the album's initial view. If the input is a tape URL,
    // derive the first photo page from it.
    const initialUrl = initialViewUrl(startUrl);
    const fromTape = initialUrl !== startUrl;
    let albumUrl = initialUrl;

    setStatus(
      fromTape ? "Fetching the initial album view…" : "Fetching album view…"
    );
    setProgress(0, 1, 0);

    const albumPage = await fetchDoc(albumUrl, signal);
    const albumDoc = albumPage.doc;
    albumUrl = albumPage.url;
    const title = albumTitle(albumDoc.title, startUrl);
    addImages(albumDoc, images, limit);

    let pagesDone = 1;

    // If the input was already the tape view, we know where to continue.
    let tapeUrl = fromTape ? startUrl : null;
    if (!tapeUrl && images.size < limit) {
      tapeUrl = findTapeHref(albumDoc, albumUrl);
    }

    let tapeDoc = null;
    if (tapeUrl && images.size < limit) {
      setStatus("Fetching the “all images on one page” view…");
      tapeDoc = (await fetchDoc(tapeUrl, signal)).doc;
      addImages(tapeDoc, images, limit);
      pagesDone += 1;
      setProgress(pagesDone, pagesDone, images.size);
    }

    const info = tapeDoc ? tapeInfo(tapeUrl) : null;
    const offsets = info ? tapeOffsets(tapeDoc, tapeUrl) : [];

    if (info && offsets.length > 1) {
      const totalPages =
        pagesDone + offsets.filter((offset) => offset !== info.offset).length;
      setProgress(pagesDone, totalPages, images.size);

      for (const offset of offsets) {
        if (offset === info.offset) continue;
        if (images.size >= limit) break;

        const pageUrl = tapeUrlForOffset(tapeUrl, offset);
        setStatus(`Fetching page ${pagesDone + 1} / ${totalPages}…`);
        const pageDoc = (await fetchDoc(pageUrl, signal)).doc;
        addImages(pageDoc, images, limit);
        pagesDone += 1;
        setProgress(pagesDone, totalPages, images.size);
      }
    } else if (tapeDoc) {
      // Fallback: follow the “next page” links one by one.
      let next = nextTapeUrl(tapeDoc, tapeUrl);
      let page = pagesDone;
      while (next && images.size < limit) {
        page += 1;
        setStatus(`Fetching page ${page}…`);
        const pageDoc = (await fetchDoc(next, signal)).doc;
        addImages(pageDoc, images, limit);
        next = nextTapeUrl(pageDoc, next);
        pagesDone = page;
        setProgress(page, page + 1, images.size);
      }
    }

    return {
      images: [...images.values()],
      title,
      sourceUrl: tapeUrl || albumUrl,
      pages: pagesDone
    };
  }

  async function run(event) {
    event.preventDefault();
    hideAlert();
    results.classList.remove("on");
    document.title = BASE_TITLE;

    let startUrl;
    let limit = Infinity;
    try {
      startUrl = normalizeUrl(urlInput.value);
      const limitRaw = limitInput.value.trim();
      if (limitRaw) {
        const parsed = Number.parseInt(limitRaw, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error("“Max images” must be a positive number.");
        }
        limit = parsed;
      }
    } catch (error) {
      showAlert(error.message);
      return;
    }

    selectAlbumOwner(startUrl);
    abortController = new AbortController();
    setBusy(true);
    setProgress(0, 1, 0);

    try {
      const result = await collect(startUrl, limit, abortController.signal);

      if (!result.images.length) {
        throw new Error(
          "No images found. Check that the album is public and the URL is correct " +
            "(password-protected albums need the ?pwd=… token)."
        );
      }

      renderResults(result);
      setStatus(
        `Done — ${result.images.length} image(s) from ${result.pages} page(s).`
      );
      setProgress(result.pages, result.pages, result.images.length);
      if (autoDownload) {
        await downloadHtml();
        showAlert(
          `Downloaded ${result.images.length} image(s) as an HTML page.`,
          "info"
        );
      } else {
        showAlert(
          `Collected ${result.images.length} image(s). Use the HTML button next to the album to save the gallery.`,
          "info"
        );
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setStatus("Cancelled.");
        showAlert("Cancelled before the album was fully collected.", "info");
      } else {
        setStatus("Failed.");
        showAlert(error.message);
      }
    } finally {
      setBusy(false);
      abortController = null;
      autoDownload = false;
      if (autoDownloadButton) {
        autoDownloadButton.disabled = false;
        autoDownloadButton.textContent = "HTML";
        autoDownloadButton = null;
      }
    }
  }

  /* ---------------------------------------------------------------- actions */

  async function downloadHtml() {
    if (!current) return;
    rememberAlbum(current);
    const html = await buildStandaloneHtml();
    const blob = new Blob([html], {
      type: "text/html;charset=utf-8"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slugify(current.title)}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function copyUrls() {
    if (!current) return;
    const text = current.images.map((image) => image.url).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showAlert(
        `Copied ${current.images.length} image URL(s) to the clipboard.`,
        "info"
      );
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      showAlert(
        `Copied ${current.images.length} image URL(s) to the clipboard.`,
        "info"
      );
    }
  }

  /* ---------------------------------------------------------------- startup */

  form.addEventListener("submit", run);
  cancelButton.addEventListener("click", () => abortController?.abort());
  copyButton.addEventListener("click", copyUrls);
  openSourceButton.addEventListener("click", () => {
    if (current) window.open(current.sourceUrl, "_blank", "noopener");
  });

  const params = new URLSearchParams(location.search);
  if (params.get("url")) urlInput.value = params.get("url");
  if (params.get("backend")) backendSelect.value = params.get("backend");

  // Restore the last collected album name so a saved/reopened page keeps it.
  if (!params.get("url")) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.title) document.title = galleryTitle(saved.title);
    } catch {
      // Ignore malformed or unavailable storage.
    }
  }

  let proxyProbe = Promise.resolve();
  if (location.protocol.startsWith("http")) {
    proxyProbe = fetch("./proxy?ping=1", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        proxyAvailable = Boolean(data?.ok);
        if (proxyAvailable && backendSelect.value === "auto") {
          setStatus(
            "Local proxy detected — requests will stay on your machine."
          );
        }
      })
      .catch(() => {
        proxyAvailable = false;
      });
  }

  /* ---------------------------------------------------------------- user selector */

  const USERS_URL = "https://imgsrc.ru/main/users.php";
  const USERS_FILE = "./users.json";
  const userLetter = $("#user-letter");
  const userSelect = $("#user-select");
  const userNext = $("#user-next");
  const userUpdate = $("#user-update");
  const userFilter = $("#user-filter");
  const userStatus = $("#user-status");
  const userInfoHost = $("#user-info");
  const albumsList = $("#albums-list");
  const albumCount = $("#album-count");
  const previewEmpty = $("#preview-empty");
  const tooltipHost = $("#tooltip-host");
  let usersList = [];
  let userInfo = null;
  let albumRequest = 0;
  let activeAlbumId = null;
  let tooltipEl = null;
  let userUpdateBusy = false;
  let pendingUser = null;
  const groupCache = new Map();
  let letterRequest = 0;
  let autoDownload = false;
  let autoDownloadButton = null;

  const setUserStatus = (text) => {
    if (userStatus) userStatus.textContent = text;
  };

  const cleanText = (value) =>
    String(value || "")
      .replace(/[\uE000-\uF8FF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  function parseUsers(html) {
    const doc = parseDoc(html);
    const users = [];
    for (const anchor of doc.querySelectorAll("a[href][target='_blank']")) {
      const href = absoluteUrl(anchor.getAttribute("href"));
      if (!href) continue;
      let pathname;
      try {
        pathname = new URL(href).pathname;
      } catch {
        continue;
      }
      if (!/^\/[^/]+\/?$/.test(pathname)) continue;
      let name;
      try {
        name = decodeURIComponent(pathname.replace(/^\/|\/$/g, ""));
      } catch {
        name = pathname.replace(/^\/|\/$/g, "");
      }
      if (!name || /^(main|members|blog|user|images|css)$/i.test(name)) {
        continue;
      }
      users.push({ name, url: `https://imgsrc.ru/${name}` });
    }
    return users;
  }

  const USER_GROUPS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0"];

  function userGroupOf(name) {
    const first = name.charAt(0).toUpperCase();
    if (first >= "A" && first <= "Z") return first;
    return "0";
  }

  const formatCount = (value) => Number(value).toLocaleString("en-US");

  function rebuildGroupCache() {
    groupCache.clear();
    for (const user of usersList) {
      const group = userGroupOf(user.name);
      let users = groupCache.get(group);
      if (!users) {
        users = [];
        groupCache.set(group, users);
      }
      users.push(user);
    }
  }

  function groupUsersOf(group) {
    if (group === "all") return usersList;
    if (!groupCache.has(group)) {
      groupCache.set(
        group,
        usersList.filter((user) => userGroupOf(user.name) === group)
      );
    }
    return groupCache.get(group);
  }

  function fillUserSelect(filter) {
    if (!userSelect) return [];
    const group = userLetter ? userLetter.value : "all";
    const pool = groupUsersOf(group);
    const needle = filter.trim().toLowerCase();
    const matches = needle
      ? pool.filter((user) => user.name.toLowerCase().includes(needle))
      : pool;
    const groups = new Map();
    for (const user of matches) {
      const label = userGroupOf(user.name);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(user);
    }
    const fragment = document.createDocumentFragment();
    for (const label of USER_GROUPS) {
      const users = groups.get(label);
      if (!users) continue;
      const optgroup = document.createElement("optgroup");
      optgroup.label = label;
      for (const user of users) {
        const option = document.createElement("option");
        option.value = user.url;
        option.textContent = user.name;
        optgroup.appendChild(option);
      }
      fragment.appendChild(optgroup);
    }
    userSelect.replaceChildren(fragment);

    if (needle) {
      setUserStatus(
        `${formatCount(matches.length)} of ${formatCount(
          pool.length
        )} match “${filter.trim()}”${group === "all" ? "" : ` in ${group}`}`
      );
    } else {
      setUserStatus(
        group === "all"
          ? `${formatCount(usersList.length)} users`
          : `${group} · ${formatCount(matches.length)} users`
      );
    }
    return matches;
  }

  function enableLetterOptions() {
    if (!userLetter) return;
    if (!USER_GROUPS.includes(userLetter.value)) {
      userLetter.value = "A";
    }
    userLetter.disabled = false;
  }

  function normalizeUsers(names) {
    const byName = new Map();
    for (const raw of names) {
      if (typeof raw !== "string") continue;
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, {
          name,
          url: `https://imgsrc.ru/${name}`
        });
      }
    }
    return [...byName.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
  }

  function usersFromData(data) {
    if (Array.isArray(data)) return normalizeUsers(data);
    if (Array.isArray(data.users)) {
      return normalizeUsers(data.users);
    }
    if (data.groups && typeof data.groups === "object") {
      const names = [];
      for (const list of Object.values(data.groups)) {
        if (Array.isArray(list)) names.push(...list);
      }
      return normalizeUsers(names);
    }
    return [];
  }

  async function readUsersJson() {
    try {
      const response = await fetch(USERS_FILE, {
        cache: "no-store"
      });
      if (!response.ok) return [];
      return usersFromData(await response.json());
    } catch {
      return [];
    }
  }

  async function scrapeUsers(group = "A") {
    await proxyProbe;
    setUserStatus(`Loading users starting with ${group}…`);
    const html = await fetchHtml(
      USERS_URL + `?let=${encodeURIComponent(group)}`
    );
    return normalizeUsers(
      parseUsers(html)
        .filter((user) => userGroupOf(user.name) === group)
        .map((user) => user.name)
    );
  }

  function mergeUsersGroup(list, incoming, group) {
    const kept = list.filter((user) => userGroupOf(user.name) !== group);
    return normalizeUsers([
      ...kept.map((user) => user.name),
      ...incoming.map((user) => user.name)
    ]);
  }

  async function loadGroup(group) {
    setUserStatus(`Updating users starting with ${group}…`);
    let fresh = [];
    let saved = false;

    try {
      const response = await fetch(
        `${USERS_FILE}?letter=${encodeURIComponent(group)}`,
        { method: "POST", cache: "no-store" }
      );
      if (response.ok) {
        fresh = usersFromData(await response.json());
        saved = fresh.length > 0;
      }
    } catch (error) {
      console.warn("Server-side user refresh unavailable.", error);
    }

    if (!fresh.length) {
      fresh = await scrapeUsers(group);
    }

    if (!fresh.length) {
      throw new Error(`No users starting with ${group} were found.`);
    }

    usersList = saved
      ? fresh
      : mergeUsersGroup(
          usersList,
          fresh.map((user) => user.name),
          group
        );
    rebuildGroupCache();
    return { users: groupUsersOf(group), saved };
  }

  let groupQueue = Promise.resolve();

  function fetchGroup(group) {
    const run = () => loadGroup(group);
    const job = groupQueue.then(run, run);
    groupQueue = job.then(
      () => undefined,
      () => undefined
    );
    return job;
  }

  async function loadUsers() {
    setUserStatus("Loading users…");
    if (userUpdate) userUpdate.disabled = false;
    usersList = await readUsersJson();

    if (!usersList.length) {
      setUserStatus("Default user list unavailable — click Update users.");
      renderUserInfo(
        "The default users.json could not be loaded. Use Update users to generate it fresh."
      );
      return;
    }

    enableLetterOptions();
    rebuildGroupCache();
    userSelect.disabled = false;
    userFilter.disabled = false;
    if (userNext) userNext.disabled = false;
    if (userUpdate) userUpdate.disabled = false;

    const wanted =
      pendingUser || new URLSearchParams(location.search).get("user");
    pendingUser = null;

    if (wanted) {
      showUserByName(wanted);
      return;
    }

    fillUserSelect("");
    userSelect.selectedIndex = 0;
    selectUser(0);
  }

  function showUserByName(name) {
    const group = userGroupOf(name);
    if (userLetter && USER_GROUPS.includes(group)) userLetter.value = group;
    if (userFilter) userFilter.value = "";
    fillUserSelect("");

    const wantedUrl = `https://imgsrc.ru/${name}`.toLowerCase();
    let index = Array.from(userSelect.options).findIndex(
      (option) => option.value.toLowerCase() === wantedUrl
    );
    if (index < 0) {
      const option = document.createElement("option");
      option.value = `https://imgsrc.ru/${name}`;
      option.textContent = name;
      userSelect.appendChild(option);
      index = userSelect.options.length - 1;
    }
    userSelect.disabled = false;
    if (userLetter) userLetter.disabled = false;
    userSelect.selectedIndex = index;
    selectUser(index);
  }

  async function updateUsers() {
    if (userUpdateBusy || !userUpdate) return;
    userUpdateBusy = true;
    userUpdate.disabled = true;
    userUpdate.textContent = "Updating…";
    const previousUser = userSelect.value;
    const group = USER_GROUPS.includes(userLetter?.value)
      ? userLetter.value
      : "A";

    try {
      const { users, saved } = await fetchGroup(group);
      if (userLetter) userLetter.value = group;
      userSelect.disabled = false;
      userFilter.disabled = false;
      if (userFilter) userFilter.value = "";
      if (userNext) userNext.disabled = false;
      fillUserSelect("");

      let index = 0;
      if (previousUser) {
        const found = Array.from(userSelect.options).findIndex(
          (option) => option.value === previousUser
        );
        if (found >= 0) index = found;
      }
      userSelect.selectedIndex = index;
      const nextUser = userSelect.options[index]?.value;
      selectUser(index, Boolean(previousUser) && nextUser !== previousUser);
      setUserStatus(
        `${formatCount(users.length)} users in ${group}${
          saved ? " · saved to users.json" : ""
        }`
      );
    } catch (error) {
      console.error("Failed to update users:", error);
      setUserStatus(`Update failed: ${error.message}`);
    } finally {
      userUpdateBusy = false;
      userUpdate.disabled = false;
      userUpdate.textContent = "Update users";
    }
  }

  async function loadUserAlbums(userUrl, userName) {
    const requestId = (albumRequest += 1);
    userInfo = null;
    setUserStatus(`Loading albums of ${userName}…`);
    if (albumsList) albumsList.replaceChildren();
    if (albumCount) albumCount.textContent = "";
    renderUserInfo();

    try {
      const html = await fetchHtml(userUrl);
      if (requestId !== albumRequest) return;
      const doc = parseDoc(html);
      userInfo = parseUserInfo(doc, userName, userUrl);
      renderUserInfo();
      if (!albumsList) return;
      renderAlbums(userInfo.albums);
      setUserStatus(
        userInfo.albums.length
          ? `${userName} · ${userInfo.albums.length} album${
              userInfo.albums.length === 1 ? "" : "s"
            }`
          : `${userName} · no public albums`
      );
    } catch (error) {
      if (requestId !== albumRequest) return;
      console.error("Failed to load user albums:", error);
      setUserStatus(`Could not load albums of ${userName}.`);
      renderUserInfo("Could not load this user's details.");
      if (albumsList) {
        albumsList.innerHTML = `<p class="note">Could not load albums: ${escapeHtml(
          error.message
        )}</p>`;
      }
    }
  }

  function renderUserInfo(message) {
    if (!userInfoHost) return;
    userInfoHost.replaceChildren();

    if (!userInfo) {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = message || "Select a user to see their details.";
      userInfoHost.appendChild(note);
      return;
    }

    const title = document.createElement("h3");
    title.textContent = userInfo.name;
    userInfoHost.appendChild(title);

    const list = document.createElement("div");
    list.className = "user-info-list";
    const rows = [...userInfo.rows, ["Albums", String(userInfo.albums.length)]];
    for (const [label, value] of rows) {
      if (!value) continue;
      const item = document.createElement("div");
      item.className = "user-info-item";
      const key = document.createElement("span");
      key.className = "user-info-key";
      key.textContent = label;
      const val = document.createElement("span");
      val.className = "user-info-val";
      val.textContent = value;
      item.append(key, val);
      list.appendChild(item);
    }
    userInfoHost.appendChild(list);

    const profile = document.createElement("p");
    profile.className = "note";
    const link = document.createElement("a");
    link.href = userInfo.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Open profile on iMGSRC.RU";
    profile.appendChild(link);
    userInfoHost.appendChild(profile);
  }

  function parseUserInfo(doc, name, url) {
    const rows = [];
    for (const labelEl of doc.querySelectorAll(".form-header")) {
      const label = cleanText(labelEl.textContent).replace(/[:：]+$/, "");
      if (!label) continue;
      let value = "";
      let node = labelEl.nextSibling;
      while (node && node.nodeType === Node.TEXT_NODE) {
        value += node.textContent;
        node = node.nextSibling;
      }
      if (
        !value &&
        node &&
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName !== "BR"
      ) {
        value = node.textContent;
      }
      value = cleanText(value);
      if (value) rows.push([label, value]);
    }

    const albums = parseAlbums(doc);
    const passwords = [
      ...new Set(albums.map((album) => album.pwd).filter(Boolean))
    ];
    if (passwords.length) rows.push(["Password", passwords.join(", ")]);

    return { name, url, rows, albums };
  }

  function parseAlbums(doc) {
    const albums = [];
    for (const row of doc.querySelectorAll("#album_list tr")) {
      const link = row.querySelector("td a[href]");
      if (!link) continue;
      const href = absoluteUrl(link.getAttribute("href"));
      if (!href) continue;
      let parsed;
      try {
        parsed = new URL(href);
      } catch {
        continue;
      }
      if (!/^\/[^/]+\/\d+\.html$/.test(parsed.pathname)) continue;

      const clone = link.cloneNode(true);
      for (const extra of clone.querySelectorAll("picture, i, .marker")) {
        extra.remove();
      }
      const title = cleanText(clone.textContent) || "Untitled album";

      const picture = link.querySelector("picture");
      let cover = null;
      if (picture) {
        const candidates = [...picture.querySelectorAll("source[srcset]")]
          .map((source) => srcsetUrls(source.getAttribute("srcset"))[0])
          .filter(Boolean)
          .map((candidate) => absoluteUrl(candidate))
          .filter(Boolean);
        cover =
          candidates.find((candidate) => /\.webp(\?|$)/i.test(candidate)) ||
          candidates.find((candidate) =>
            /\.(jpe?g|png|gif|avif)(\?|$)/i.test(candidate)
          ) ||
          candidates[0] ||
          null;
      }

      const cells = row.querySelectorAll("td");
      const cellText = (index) =>
        cleanText(cells[index] ? cells[index].textContent : "");
      const locked =
        Boolean(link.querySelector("i.mi-b")) || /\block\b/i.test(cellText(0));

      albums.push({
        href,
        title,
        cover,
        section: cellText(1),
        photos: cellText(2),
        visibility: cellText(3).replace(/\s+/g, ""),
        modified: cellText(6),
        pwd: parsed.searchParams.get("pwd") || "",
        locked
      });
    }
    return albums;
  }

  function openAlbum(album, card, download, button) {
    hideTooltip();
    activeAlbumId = albumIdFromUrl(album.href);
    for (const other of albumsList.querySelectorAll(".album-card.active")) {
      other.classList.remove("active");
    }
    card?.classList.add("active");
    if (previewEmpty) previewEmpty.hidden = true;
    urlInput.value = album.href;
    autoDownload = download;
    autoDownloadButton = download ? button : null;
    if (download && button) {
      button.disabled = true;
      button.textContent = "…";
    }
    form.requestSubmit();
  }

  function renderAlbums(albums) {
    if (!albumsList) return;
    albumsList.replaceChildren();
    if (albumCount) {
      albumCount.textContent = albums.length
        ? `${albums.length} album${albums.length === 1 ? "" : "s"}`
        : "";
    }
    if (!albums.length) {
      albumsList.innerHTML = `<p class="note">No public albums.</p>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const album of albums) {
      const row = document.createElement("div");
      row.className = "album-row";

      const card = document.createElement("a");
      card.className = "album-card";
      card.href = album.href;
      card.rel = "noopener";
      if (activeAlbumId && albumIdFromUrl(album.href) === activeAlbumId) {
        card.classList.add("active");
      }

      const cover = document.createElement("span");
      cover.className = "album-cover";
      if (album.cover) {
        const image = document.createElement("img");
        image.src = album.cover;
        image.alt = album.title;
        image.loading = "lazy";
        cover.appendChild(image);
      } else {
        cover.classList.add("album-cover-empty");
        cover.textContent = album.locked ? "locked" : "no preview";
      }
      card.appendChild(cover);

      const body = document.createElement("div");
      body.className = "album-body";
      const title = document.createElement("div");
      title.className = "album-title";
      title.textContent = album.title;
      body.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "album-meta";
      meta.textContent = [
        album.section,
        album.photos && `${album.photos} photos`,
        album.locked && "locked"
      ]
        .filter(Boolean)
        .join(" · ");
      body.appendChild(meta);
      card.appendChild(body);

      const rows = [
        album.section && ["Section", album.section],
        album.photos && ["Photos", album.photos],
        album.visibility && ["Visibility", album.visibility],
        album.pwd && ["Password", album.pwd],
        album.modified && ["Modified", album.modified],
        album.locked && ["Access", "locked / private"]
      ].filter(Boolean);

      card.addEventListener("mouseenter", (event) =>
        showTooltip(album.title, rows, event)
      );
      card.addEventListener("mousemove", moveTooltip);
      card.addEventListener("mouseleave", hideTooltip);
      card.addEventListener("click", (event) => {
        event.preventDefault();
        openAlbum(album, card, false, null);
      });

      const download = document.createElement("button");
      download.type = "button";
      download.className = "album-download";
      download.textContent = "HTML";
      download.title = `Download “${album.title}” as an HTML page`;
      download.setAttribute(
        "aria-label",
        `Download “${album.title}” as an HTML page`
      );
      download.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openAlbum(album, card, true, download);
      });

      row.append(card, download);
      fragment.appendChild(row);
    }
    albumsList.appendChild(fragment);
  }

  function showTooltip(title, rows, event) {
    hideTooltip();
    const el = document.createElement("div");
    el.className = "user-info-tooltip";
    const heading = document.createElement("strong");
    heading.textContent = title;
    el.appendChild(heading);
    for (const [label, value] of rows) {
      if (!value) continue;
      const row = document.createElement("div");
      row.className = "user-info-row";
      const labelEl = document.createElement("span");
      labelEl.className = "user-info-label";
      labelEl.textContent = label;
      const valueEl = document.createElement("span");
      valueEl.className = "user-info-value";
      valueEl.textContent = value;
      row.append(labelEl, valueEl);
      el.appendChild(row);
    }
    (tooltipHost || document.body).appendChild(el);
    tooltipEl = el;
    moveTooltip(event);
  }

  function moveTooltip(event) {
    if (!tooltipEl) return;
    const pad = 14;
    const rect = tooltipEl.getBoundingClientRect();
    let x = event.clientX + pad;
    let y = event.clientY + pad;
    if (x + rect.width > window.innerWidth - 8) {
      x = event.clientX - rect.width - pad;
    }
    if (y + rect.height > window.innerHeight - 8) {
      y = event.clientY - rect.height - pad;
    }
    tooltipEl.style.left = `${Math.max(8, x)}px`;
    tooltipEl.style.top = `${Math.max(8, y)}px`;
  }

  function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.remove();
    tooltipEl = null;
  }

  function userFromAlbumUrl(url) {
    try {
      const segment = new URL(url).pathname.split("/")[1] || "";
      const name = decodeURIComponent(segment);
      if (!name || /^(main|members|blog|user|images|css)$/i.test(name)) {
        return null;
      }
      return name;
    } catch {
      return null;
    }
  }

  function albumIdFromUrl(url) {
    try {
      const path = new URL(url).pathname;
      const photo = path.match(/\/(\d+)\.html$/);
      if (photo) return photo[1];
      const tape = path.match(/tape-(\d+)-/);
      if (tape) return tape[1];
      return null;
    } catch {
      return null;
    }
  }

  function highlightActiveAlbum() {
    for (const card of albumsList?.querySelectorAll(".album-card") || []) {
      card.classList.toggle(
        "active",
        Boolean(activeAlbumId) && albumIdFromUrl(card.href) === activeAlbumId
      );
    }
  }

  function selectAlbumOwner(url) {
    const name = userFromAlbumUrl(url);
    if (!name) return;
    activeAlbumId = albumIdFromUrl(url);
    const wantedUrl = `https://imgsrc.ru/${name}`.toLowerCase();
    if (userSelect.value && userSelect.value.toLowerCase() === wantedUrl) {
      highlightActiveAlbum();
      return;
    }
    if (!usersList.length && !userSelect.options.length) {
      pendingUser = name;
      return;
    }
    showUserByName(name);
  }

  function resetPreview() {
    abortController?.abort();
    abortController = null;
    current = null;
    grid.replaceChildren();
    results.classList.remove("on");
    resultsTitle.textContent = "Album";
    resultsMeta.textContent = "";
    if (previewEmpty) previewEmpty.hidden = false;
  }

  function selectUser(index, reset = false) {
    const option = userSelect.options[index];
    if (!option) return;
    if (reset) resetPreview();
    loadUserAlbums(option.value, option.textContent);
  }

  if (userLetter) {
    userLetter.addEventListener("change", async () => {
      const group = userLetter.value;
      const requestId = (letterRequest += 1);
      if (userFilter) userFilter.value = "";

      // Show the users already loaded for this letter while the refresh runs.
      const cached = fillUserSelect("");
      if (cached.length) {
        userSelect.selectedIndex = 0;
        selectUser(0, true);
      } else {
        resetPreview();
        albumsList.replaceChildren();
        userInfo = null;
        renderUserInfo();
      }

      try {
        const { users, saved } = await fetchGroup(group);
        if (requestId !== letterRequest || userLetter.value !== group) return;

        const previous = userSelect.value;
        const matches = fillUserSelect("");
        if (!matches.length) {
          resetPreview();
          albumsList.replaceChildren();
          userInfo = null;
          renderUserInfo();
          setUserStatus(`No users starting with ${group}.`);
          return;
        }

        let index = 0;
        if (previous) {
          const found = Array.from(userSelect.options).findIndex(
            (option) => option.value === previous
          );
          if (found >= 0) index = found;
        }
        const changed = userSelect.options[index]?.value !== previous;
        userSelect.selectedIndex = index;
        if (changed || !cached.length) selectUser(index, true);
        setUserStatus(
          `${formatCount(users.length)} users in ${group}${
            saved ? " · saved to users.json" : ""
          }`
        );
      } catch (error) {
        if (requestId !== letterRequest) return;
        console.error("Failed to update users:", error);
        setUserStatus(`Update failed: ${error.message}`);
      }
    });
  }

  if (userSelect) {
    userSelect.addEventListener("change", () => {
      selectUser(userSelect.selectedIndex, true);
    });
    userSelect.addEventListener("mouseenter", showUserTooltip);
    userSelect.addEventListener("mousemove", moveTooltip);
    userSelect.addEventListener("mouseleave", hideTooltip);
  }

  if (userNext) {
    userNext.addEventListener("click", () => {
      const count = userSelect.options.length;
      if (!count) return;
      const index = (userSelect.selectedIndex + 1) % count;
      userSelect.selectedIndex = index;
      selectUser(index, true);
    });
  }

  if (userUpdate) {
    userUpdate.addEventListener("click", updateUsers);
  }

  function showUserTooltip(event) {
    if (!userInfo) return;
    const rows = userInfo.rows.map((row) => [...row]);
    rows.push(["Albums", String(userInfo.albums.length)]);
    showTooltip(userInfo.name, rows, event);
  }

  if (userStatus) {
    userStatus.addEventListener("mouseenter", showUserTooltip);
    userStatus.addEventListener("mousemove", moveTooltip);
    userStatus.addEventListener("mouseleave", hideTooltip);
  }

  window.addEventListener("scroll", hideTooltip, true);

  if (userFilter) {
    let filterTimer = 0;
    userFilter.addEventListener("input", () => {
      window.clearTimeout(filterTimer);
      filterTimer = window.setTimeout(() => {
        const matches = fillUserSelect(userFilter.value);
        if (!matches.length) {
          resetPreview();
          albumsList.replaceChildren();
          userInfo = null;
          renderUserInfo();
          setUserStatus(`No users match “${userFilter.value.trim()}”.`);
          return;
        }
        userSelect.selectedIndex = 0;
        selectUser(0, true);
      }, 250);
    });
  }

  loadGalleryAssets().catch(() => {});
  loadUsers();

  if (params.get("url")) {
    form.requestSubmit();
  }
})();
