#!/usr/bin/env node
/**
 * imgsrc-webp-album.mjs
 *
 * Collects every full-size WEBP, GIF or JPG image of an iMGSRC.RU album with
 * Playwright and writes them into a single, self-contained HTML gallery
 * (a list of images). WEBP and GIF are preferred; JPG is used as fallback.
 *
 * Usage:
 *   node imgsrc-webp-album.mjs <album-url> [options]
 *
 *   <album-url>   Any of:
 *                   https://imgsrc.ru/<user>/<photo-id>.html   (album photo page)
 *                   https://imgsrc.ru/<user>/tape-<album>-<first>-<offset>.html
 *                 The script follows the "all images on one page" (tape) view and
 *                 paginates through it automatically.
 *
 * Options:
 *   --out <file>        Output HTML file (default: imgsrc-album.html)
 *   --download [dir]    Also download the WEBP/GIF/JPG files into <dir>
 *                       (default: webp) and reference them locally in the HTML.
 *                       Falls back to the JPG variant when no WEBP or GIF
 *                       file is available.
 *   --limit <n>         Stop after n images (useful for a quick test).
 *   --headed            Show the browser window.
 *   --slow <ms>         Slow down Playwright actions (debugging).
 *   -h, --help          Show this help.
 *
 * Examples:
 *   node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/86495337.html
 *   node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/86495337.html --download
 *   node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/tape-2499131-73989830-0.html --out torun.html
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/126.0.0.0 Safari/537.36";
const MAX_PAGES = 500; // safety net
const FORMAT_RANK = { gif: 3, webp: 2, jpg: 1 }; // preferred format per photo
const FALLBACK_IMAGE_EXT = "jpg";

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

function usage() {
  const text = `
Collect all WEBP, GIF and JPG images of an iMGSRC.RU album into one HTML file.

Usage:
  node imgsrc-webp-album.mjs <album-url> [options]

Options:
  --out <file>        Output HTML file (default: imgsrc-album.html)
  --download [dir]    Download the WEBP/GIF/JPG files into <dir> (default: webp)
                      and fall back to JPG when no WEBP or GIF is available
  --limit <n>         Stop after n images
  --headed            Show the browser window
  --slow <ms>         Slow down Playwright actions
  -h, --help          Show this help
`;
  console.log(text.trim());
}

function parseArgs(argv) {
  const opts = {
    url: null,
    out: "imgsrc-album.html",
    downloadDir: null,
    limit: Infinity,
    headed: false,
    slow: 0
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    }

    if (arg === "--out" || arg.startsWith("--out=")) {
      opts.out = arg.includes("=") ? arg.slice("--out=".length) : argv[++i];
      if (!opts.out) throw new Error("--out needs a file name");
      continue;
    }

    if (arg === "--download" || arg.startsWith("--download=")) {
      if (arg.includes("=")) {
        opts.downloadDir = arg.slice("--download=".length);
      } else if (argv[i + 1] && !argv[i + 1].startsWith("-")) {
        opts.downloadDir = argv[++i];
      } else {
        opts.downloadDir = "webp";
      }
      continue;
    }

    if (arg === "--limit" || arg.startsWith("--limit=")) {
      const raw = arg.includes("=") ? arg.slice("--limit=".length) : argv[++i];
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n) || n <= 0)
        throw new Error("--limit needs a positive number");
      opts.limit = n;
      continue;
    }

    if (arg === "--headed") {
      opts.headed = true;
      continue;
    }

    if (arg === "--slow" || arg.startsWith("--slow=")) {
      const raw = arg.includes("=") ? arg.slice("--slow=".length) : argv[++i];
      opts.slow = Number.parseInt(raw, 10) || 0;
      continue;
    }

    if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);

    if (!opts.url) {
      opts.url = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!opts.url) {
    usage();
    throw new Error("Missing album URL");
  }

  return opts;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeAlbumUrl(input) {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  const url = new URL(raw);

  if (!/(^|\.)imgsrc\.ru$/i.test(url.hostname)) {
    throw new Error(`Not an iMGSRC.RU URL: ${input}`);
  }

  url.hash = "";
  return url.toString();
}

function absoluteUrl(src) {
  if (!src) return null;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return new URL(src, "https://imgsrc.ru/").toString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Extracts the next tape-page URL from a set of links, or null. */
function nextTapeUrl(hrefs, currentUrl) {
  const current = new URL(currentUrl);
  const currentMatch = current.pathname.match(
    /\/tape-(\d+)-(\d+)-(\d+)\.html$/
  );
  if (!currentMatch) return null;

  const [, albumId, firstId, offsetRaw] = currentMatch;
  const currentOffset = Number.parseInt(offsetRaw, 10);
  const candidates = [];

  for (const href of hrefs) {
    let url;
    try {
      url = new URL(href, current);
    } catch {
      continue;
    }

    const match = url.pathname.match(/\/tape-(\d+)-(\d+)-(\d+)\.html$/);
    if (!match) continue;
    if (match[1] !== albumId || match[2] !== firstId) continue;

    const offset = Number.parseInt(match[3], 10);
    if (offset <= currentOffset) continue;

    // Preserve the album password, if the page carries one.
    if (current.searchParams.get("pwd") && !url.searchParams.has("pwd")) {
      url.searchParams.set("pwd", current.searchParams.get("pwd"));
    }
    url.hash = "";
    candidates.push({ offset, url: url.toString() });
  }

  candidates.sort((a, b) => a.offset - b.offset);
  return candidates[0]?.url ?? null;
}

/* -------------------------------------------------------------------------- */
/* Scraping                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Pull full-size WEBP, GIF or JPG URLs + captions from the current page.
 * Each item carries the numeric photo id so a WEBP preview can be replaced by
 * the animated GIF original of the same photo, and so the JPG variant can be
 * used as a fallback when no WEBP or GIF file is available.
 */
async function extractImages(page) {
  return page.evaluate(() => {
    const result = [];

    // <source type> → internal format name.
    const TYPE_TO_EXT = {
      "image/webp": "webp",
      "image/gif": "gif",
      "image/jpeg": "jpg",
      "image/jpg": "jpg"
    };

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
      if (!url) return;
      const id = (url.match(/imgsrc\.ru_(\d+)/) || [])[1] || null;
      result.push({ url, caption, width, height, ext, id });
    };

    const absoluteUrl = (src) => {
      if (!src) return null;
      if (src.startsWith("//")) return `https:${src}`;
      if (/^https?:\/\//i.test(src)) return src;
      return new URL(src, "https://imgsrc.ru/").toString();
    };

    const srcsetUrls = (srcset) =>
      String(srcset || "")
        .split(",")
        .map((part) => part.trim().split(/\s+/)[0])
        .filter(Boolean);

    const imageExtOf = (url) => {
      try {
        const file = decodeURIComponent(
          new URL(url).pathname.split("/").pop() || ""
        ).toLowerCase();
        const dot = file.lastIndexOf(".");
        if (dot < 0) return null;
        const rawExt = file.slice(dot + 1);
        const ext = rawExt === "jpeg" ? "jpg" : rawExt;
        return ["webp", "gif", "jpg"].includes(ext) ? ext : null;
      } catch {
        return null;
      }
    };

    const handleSource = (source, caption, width, height) => {
      const type = (source.getAttribute("type") || "").toLowerCase();
      const ext = TYPE_TO_EXT[type];
      if (!ext) return;

      const srcset =
        source.getAttribute("srcset") || source.getAttribute("src") || "";
      for (const url of srcsetUrls(srcset)) {
        // Full-size files are named imgsrc.ru_<photoId><hash>.webp-or-.jpg;
        // thumbnails (prev/next navigation) do not have the "imgsrc.ru_" prefix.
        if (!/imgsrc\.ru_\d+/.test(url)) continue;
        push(url, caption, width, height, ext);
      }
    };

    // Full-size sources of every <picture> element — animated GIFs arrive
    // as image/gif sources, static photos as image/webp or image/jpeg
    // (the latter being the fallback when no WEBP file exists).
    for (const picture of document.querySelectorAll("picture")) {
      const img = picture.querySelector("img");
      const width = img?.getAttribute("width") || null;
      const height = img?.getAttribute("height") || null;
      for (const source of picture.querySelectorAll("source")) {
        handleSource(source, captionOf(picture), width, height);
      }
    }

    // Full-size images that are plain <img> sources (animated GIFs).
    for (const img of document.querySelectorAll("img")) {
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

    // On single-photo pages the GIF URL sits in an inline onclick handler.
    for (const element of document.querySelectorAll("[onclick]")) {
      const onclick = element.getAttribute("onclick") || "";
      const match = onclick.match(/['"]([^'"]*imgsrc\.ru_\d+[^'"]*\.gif)['"]/i);
      if (!match) continue;

      const big = element.querySelector("img.big");
      const name = document.getElementById("photo_name")?.textContent?.trim();
      push(
        match[1],
        name || captionOf(element),
        big?.getAttribute("width") || null,
        big?.getAttribute("height") || null,
        "gif"
      );
    }

    return result;
  });
}

/**
 * Turns a tape URL into the album's initial view (its first photo page).
 * Photo/album page URLs already are an album view and are returned unchanged.
 */
function initialViewUrl(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^(.*)\/tape-\d+-(\d+)-\d+\.html$/);
  if (!match) return url;
  parsed.pathname = `${match[1]}/${match[2]}.html`;
  parsed.hash = "";
  return parsed.toString();
}

/** Finds the tape link that belongs to the same user/album as `currentUrl`. */
function findTapeHref(hrefs, currentUrl) {
  const current = new URL(currentUrl);
  const userPrefix = current.pathname.replace(/\/[^/]*$/, "/");

  for (const href of hrefs) {
    let url;
    try {
      url = new URL(href, current);
    } catch {
      continue;
    }

    if (!/\/tape-\d+-\d+-\d+\.html$/.test(url.pathname)) continue;
    if (!url.pathname.startsWith(userPrefix)) continue;

    // Preserve the album password, if the page carries one.
    if (current.searchParams.get("pwd") && !url.searchParams.has("pwd")) {
      url.searchParams.set("pwd", current.searchParams.get("pwd"));
    }
    url.hash = "";
    return url.toString();
  }

  return null;
}

/**
 * Starts at the album's initial view (the page the user pointed at, or the
 * first photo page derived from a tape URL), then continues to the
 * "all images on one page" tape view and paginates through it.
 */
async function collectAlbum(page, inputUrl, limit) {
  const images = new Map(); // photo key -> image
  const seenPages = new Set();
  let pageCount = 0;
  let title = "";

  const visit = async (url) => {
    if (!url || seenPages.has(url) || pageCount >= MAX_PAGES) return false;

    seenPages.add(url);
    pageCount += 1;

    console.log(`→ page ${pageCount}: ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000
    });

    // Some albums show a “foreword” page (…?preword=show) before the album.
    // Submit its GET form to reach the album itself.
    const continueHref = await page.evaluate(() => {
      const form = document.querySelector("form[name='preword']");
      if (!form) return null;

      const url = new URL(
        form.getAttribute("action") || location.href,
        location.href
      );
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
          !field.checked
        ) {
          continue;
        }
        params.set(name, field.value ?? "");
      }

      const pwd = new URL(location.href).searchParams.get("pwd");
      if (pwd && !params.has("pwd")) params.set("pwd", pwd);

      params.delete("preword");
      url.search = params.toString();
      url.hash = "";
      return url.toString();
    });

    if (continueHref) {
      console.log("   → skipping the album foreword");
      seenPages.add(continueHref);
      await page.goto(continueHref, {
        waitUntil: "domcontentloaded",
        timeout: 60_000
      });
    }

    if (!title) title = albumTitle(await page.title(), inputUrl);

    // Album/photo views may not contain full-size sources; don't fail on them.
    await page
      .waitForSelector(
        'picture source[type="image/webp"], picture source[type="image/gif"], picture source[type="image/jpeg"], img.big[src*=".gif" i]',
        { state: "attached", timeout: 15_000 }
      )
      .catch(() => {});

    const found = await extractImages(page);
    let added = 0;

    for (const item of found) {
      const url = absoluteUrl(item.url);
      if (!url) continue;

      const key = item.id ? `id:${item.id}` : url;
      const existing = images.get(key);

      if (existing) {
        // Prefer the animated GIF over a static WEBP preview of the same
        // photo, and the WEBP over the JPG fallback variant — i.e. a photo
        // that exists as WEBP uses WEBP, even if a JPG file is around, too.
        if ((FORMAT_RANK[item.ext] || 0) > (FORMAT_RANK[existing.ext] || 0)) {
          images.set(key, { ...item, url });
        }
        continue;
      }

      if (images.size >= limit) break;
      images.set(key, { ...item, url });
      added += 1;
    }

    console.log(`   ${added} new image(s), ${images.size} total`);
    return true;
  };

  const initialUrl = initialViewUrl(inputUrl);
  const fromTape = initialUrl !== inputUrl;
  let albumUrl = initialUrl;
  await visit(albumUrl);

  // Use the page actually reached (a “foreword” page may have been skipped).
  albumUrl = page.url() || albumUrl;

  // If the input was a tape URL, we already know the tape view to continue to.
  let tapeUrl = fromTape ? inputUrl : null;

  if (!tapeUrl && images.size < limit) {
    const hrefs = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => a.href)
    );
    tapeUrl = findTapeHref(hrefs, albumUrl);
  }

  if (tapeUrl && images.size < limit && !seenPages.has(tapeUrl)) {
    console.log("   → switching to the “all images on one page” view");
    await visit(tapeUrl);
  }

  // Continue through the remaining tape pages.
  let next = null;
  if (tapeUrl && seenPages.has(tapeUrl) && images.size < limit) {
    const hrefs = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => a.href)
    );
    next = nextTapeUrl(hrefs, tapeUrl);
  }

  while (next && images.size < limit && pageCount < MAX_PAGES) {
    const visited = await visit(next);
    if (!visited || images.size >= limit) break;

    const hrefs = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => a.href)
    );
    next = nextTapeUrl(hrefs, next);
  }

  return {
    images: [...images.values()],
    pages: pageCount,
    title,
    tapeUrl: tapeUrl || albumUrl
  };
}

function albumTitle(pageTitle, fallbackUrl) {
  const cleaned = (pageTitle || "").replace(/\s*@iMGSRC\.RU\s*$/i, "").trim();
  if (!cleaned) return fallbackUrl;
  // Photo pages look like "Album name / filename.jpg".
  return cleaned.split(" / ")[0].trim() || cleaned;
}

/* -------------------------------------------------------------------------- */
/* Download                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Swaps the file extension of a media URL to its JPG fallback variant
 * (…/<hash>.webp → …/<hash>.jpg, …/<hash>.gif → …/<hash>.jpg).
 */
function jpgFallbackUrl(url) {
  if (!url) return null;
  const parsed = new URL(url);
  if (!/\.[a-z0-9]+$/i.test(parsed.pathname)) return null;
  parsed.pathname = parsed.pathname.replace(
    /\.[a-z0-9]+$/i,
    `.${FALLBACK_IMAGE_EXT}`
  );
  return parsed.toString();
}

/**
 * Download candidates for one image: its own URL first (WEBP/GIF/JPG), then
 * the JPG fallback when no WEBP or GIF file is available.
 */
function downloadCandidates(image) {
  const urls = [];
  const add = (value) => {
    const url = absoluteUrl(value);
    if (url && !urls.includes(url)) urls.push(url);
  };
  add(image.url);
  const fallback = jpgFallbackUrl(image.url);
  if (fallback) add(fallback);
  return urls;
}

async function downloadImages(request, images, dir) {
  await mkdir(dir, { recursive: true });
  const usedNames = new Set();
  let ok = 0;
  let failed = 0;

  for (const [index, image] of images.entries()) {
    const urls = downloadCandidates(image);
    let savedName = null;

    for (const url of urls) {
      const urlPath = new URL(url).pathname;
      let name =
        decodeURIComponent(path.basename(urlPath)) ||
        `image-${index + 1}.${image.ext === "gif" ? "gif" : image.ext === "jpg" ? "jpg" : "webp"}`;
      let extension = path.extname(name).toLowerCase();
      if (!/\.(webp|gif|jpe?g)$/i.test(extension)) {
        const fallbackExt =
          image.ext === "gif" ? "gif" : image.ext === "jpg" ? "jpg" : "webp";
        extension = `.${fallbackExt}`;
        name += extension;
      }

      let candidate = name;
      let n = 2;
      while (usedNames.has(candidate)) {
        candidate = `${name.slice(0, -extension.length)}-${n}${extension}`;
        n += 1;
      }

      const target = path.join(dir, candidate);
      try {
        const response = await request.get(url, {
          headers: { referer: "https://imgsrc.ru/" },
          timeout: 60_000
        });
        if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
        await writeFile(target, await response.body());
        usedNames.add(candidate);
        savedName = candidate;
        break;
      } catch (error) {
        console.warn(`\n   ! ${candidate}: ${error.message}`);
      }
    }

    if (savedName) {
      image.local = savedName;
      ok += 1;
      process.stdout.write(`\r   downloaded ${ok}/${images.length}…`);
    } else {
      failed += 1;
    }
  }

  if (images.length) process.stdout.write("\n");
  console.log(
    `   saved ${ok} file(s) to ${dir}${failed ? `, ${failed} failed` : ""}`
  );
}

/* -------------------------------------------------------------------------- */
/* HTML output                                                                */
/* -------------------------------------------------------------------------- */

function renderHtml({ title, sourceUrl, images, localBase }) {
  const generated =
    new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const downloaded = Boolean(localBase);

  const cards = images
    .map((image, index) => {
      const src =
        downloaded && image.local
          ? localBase === "."
            ? encodeURIComponent(image.local)
            : `${localBase}/${encodeURIComponent(image.local)}`
          : image.url;
      const label = image.caption || path.basename(new URL(image.url).pathname);
      const dims =
        image.width && image.height ? `${image.width} × ${image.height}` : "";

      return `      <figure class="card">
        <a class="frame" href="${escapeHtml(src)}" target="_blank" rel="noopener">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(label)}" loading="lazy" decoding="async">
        </a>
        <figcaption>
          <span class="idx">${index + 1}</span>
          <span class="name" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
          ${dims ? `<span class="dims">${escapeHtml(dims)}</span>` : ""}
        </figcaption>
      </figure>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
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
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
    gap: 16px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .card {
    margin: 0;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .frame {
    display: block;
    aspect-ratio: 4 / 3;
    background: #0b0d11;
    overflow: hidden;
  }
  .frame img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    transition: transform .18s ease;
  }
  .frame:hover img { transform: scale(1.02); }
  figcaption {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    font-size: 12.5px;
    border-top: 1px solid var(--line);
    min-width: 0;
  }
  .idx {
    flex: none;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    min-width: 2.5em;
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dims { flex: none; color: var(--muted); }
  footer { margin-top: 32px; color: var(--muted); font-size: 12px; }

  /* Lightbox */
  #lb {
    position: fixed;
    inset: 0;
    display: none;
    place-items: center;
    background: rgba(0, 0, 0, .92);
    z-index: 50;
    padding: 24px;
  }
  #lb.open { display: grid; }
  #lb img {
    max-width: 100%;
    max-height: calc(100vh - 90px);
    object-fit: contain;
    border-radius: 4px;
  }
  #lb .bar {
    position: absolute;
    left: 0; right: 0; bottom: 14px;
    display: flex;
    justify-content: center;
    gap: 16px;
    color: var(--muted);
    font-size: 13px;
  }
  #lb button {
    background: #1d212b;
    color: var(--text);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 4px 12px;
    cursor: pointer;
  }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    ${images.length} image${images.length === 1 ? "" : "s"} (WEBP/GIF/JPG)${downloaded ? " (downloaded locally)" : ""} ·
    source: <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(sourceUrl)}</a><br>
    generated ${escapeHtml(generated)} with Playwright
  </div>
</header>

<main class="grid">
${cards}
</main>

<footer>Click an image to view it full size. Use ← / → to move, Esc to close.</footer>

<div id="lb" role="dialog" aria-modal="true" aria-label="Image viewer">
  <img alt="">
  <div class="bar">
    <button type="button" data-nav="-1">← Prev</button>
    <span id="lb-count"></span>
    <button type="button" data-nav="1">Next →</button>
    <button type="button" data-close>Close</button>
  </div>
</div>

<script>
(() => {
  const cards = [...document.querySelectorAll(".card img")];
  const lightbox = document.getElementById("lb");
  const lightboxImg = lightbox.querySelector("img");
  const counter = document.getElementById("lb-count");
  let current = -1;

  function show(index) {
    if (!cards.length) return;
    current = (index + cards.length) % cards.length;
    lightboxImg.src = cards[current].src;
    lightboxImg.alt = cards[current].alt;
    counter.textContent = (current + 1) + " / " + cards.length;
    lightbox.classList.add("open");
  }

  function close() {
    lightbox.classList.remove("open");
    lightboxImg.removeAttribute("src");
  }

  cards.forEach((img, index) => {
    img.closest("a").addEventListener("click", (event) => {
      event.preventDefault();
      show(index);
    });
  });

  lightbox.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav) { show(current + Number(nav.dataset.nav)); return; }
    if (event.target.closest("[data-close]") || event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });
})();
</script>
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const startUrl = normalizeAlbumUrl(opts.url);

  const browser = await chromium.launch({
    headless: !opts.headed,
    slowMo: opts.slow
  });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "en-US",
    viewport: { width: 1400, height: 900 }
  });

  // iMGSRC.RU puts adult albums behind a one-click “over 18” page and
  // remembers the answer in this cookie, so pre-accept it.
  await context.addCookies([
    {
      name: "over18",
      value: "yeah",
      domain: ".imgsrc.ru",
      path: "/"
    }
  ]);

  const page = await context.newPage();

  try {
    console.log(`Album: ${startUrl}`);
    const { images, pages, title, tapeUrl } = await collectAlbum(
      page,
      startUrl,
      opts.limit
    );

    if (!images.length) {
      throw new Error(
        "No WEBP, GIF or JPG images found. Check that the URL points to a public album or photo page."
      );
    }

    const sourceUrl = tapeUrl;

    let localBase = null;
    if (opts.downloadDir) {
      await downloadImages(context.request, images, opts.downloadDir);
      localBase =
        path
          .relative(
            path.dirname(path.resolve(opts.out)),
            path.resolve(opts.downloadDir)
          )
          .split(path.sep)
          .filter(Boolean)
          .map(encodeURIComponent)
          .join("/") || ".";
    }

    const html = renderHtml({
      title,
      sourceUrl,
      images,
      localBase
    });
    await writeFile(opts.out, html, "utf8");

    console.log("");
    console.log(`✓ ${images.length} image(s) from ${pages} page(s)`);
    console.log(`✓ HTML written to ${path.resolve(opts.out)}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
