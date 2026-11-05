# iMGSRC.RU album → WEBP & GIF HTML gallery

Two ways to turn an iMGSRC.RU album into a list of all its full-size **WEBP**,
**GIF** and **JPG** images:

|                                 |                                        |
| ------------------------------- | -------------------------------------- |
| `index.html` + `cors-proxy.mjs` | Browser UI, no Playwright needed       |
| `imgsrc-webp-album.mjs`         | Playwright script for the command line |

The browser UI is split into `index.html` (markup), `styles.css` (explorer and
form styles), `app.js` (collector, user/album explorer) and `lightbox.js`
(image viewer). `gallery.css` holds the grid and lightbox rules that the
exported HTML file needs; the export inlines `gallery.css` and `lightbox.js` so
the downloaded page stays a single self-contained file.

Both start at the album's initial view, continue to the paginated "all images
on one page" (`tape-…`) view, list each photo once and can export a standalone
HTML gallery. When a photo is available in several formats, `index.html`
prefers the WEBP version; the Playwright script prefers the animated GIF, then
WEBP, then the JPG variant. Downloads prefer WEBP and GIF files and fall back
to the JPG variant when no WEBP or GIF file is available.

## Browser version

iMGSRC.RU sends no CORS headers, so a web page cannot read its HTML directly.
`index.html` therefore supports two relays:

1. **Jina Reader** (`r.jina.ai`) — works with zero setup, even from `file://`.
   Free tier is limited to 20 requests/minute; the page throttles and retries
   automatically. Optional API key field available.
2. **Local proxy** — private and fast. Start it once:

   ```bash
   node cors-proxy.mjs
   ```

   Then open <http://localhost:8787> and use the page from there. The proxy only
   relays `imgsrc.ru` hosts and is not an open proxy. It also serves
   `styles.css`, `gallery.css`, `app.js` and `lightbox.js`, so no separate
   static server is needed.

Usage:

1. Open <http://localhost:8787> (or double-click `index.html` to use the Jina
   relay).
2. Paste an album/photo URL, for example
   `https://imgsrc.ru/user/123456.html?pwd=…`.
3. Optionally set **Max images** for a quick test.
4. Click **Collect images**.
5. Use the **HTML** button next to an album to download the same standalone
   gallery the Playwright script produces (this needs the local proxy, because
   the export inlines `gallery.css` and `lightbox.js`), **Copy image URLs** to
   get a plain list, or click an image to open the lightbox.

When a collection finishes, the album name is written to the page's document
title (`<album> — iMGSRC.RU WEBP & GIF gallery`) and remembered in `localStorage`, so
a saved or reopened `index.html` keeps showing it. The exported file is named
after the album and stores the name in its `<title>` and
`<meta name="album">` tag.

The page supports deep links:

```
index.html?url=https%3A%2F%2Fimgsrc.ru%2Fuser%2F123456.html&backend=proxy
```

### Explorer

The left side holds two stacked blocks: **User** on top for picking a user and
seeing their details, **Albums** below it listing that user's albums as a
single column of preview images. The selected album's images fill the
remaining space on the right. **Starts with** limits the user list to one
character group (default `A`), so the page renders a few thousand options
instead of all ~65,000. **Select user** loads that user's details and albums;
the **Filter users** field narrows the current group, and **Next user →**
advances to the next entry. Hovering a user or an album shows its details in a
tooltip.

Clicking an album loads it into the collector so its images appear in the
preview pane. The **HTML** button next to an album collects that album and
immediately downloads the standalone gallery page to the local machine,
without opening the album first. Entering an album URL in the collector form
also switches the left side to that album's owner: the **Starts with** group
and **Select user** follow the URL, the owner's albums are listed, and the
collected album is highlighted in that list.

The list is loaded once at startup from the default `users.json`, generated
from <https://imgsrc.ru/main/users.php>:

```bash
node build-users-json.mjs
```

The page does not scrape `users.php` at startup. The **Starts with** options are
static (`A`–`Z`, `0`) and present before any data loads. Choosing a letter
reloads exactly that letter from iMGSRC.RU — the same operation as **Update
users**, which stays available as a manual retry. With `cors-proxy.mjs` running
the page sends `POST /users.json?letter=A`, which scrapes that one page and
replaces just that group in `users.json` and in memory; without the proxy the
page scrapes the single letter itself and merges it into the list for that
session. The letter's already-loaded users are cached and shown immediately
while the refresh runs. `cors-proxy.mjs` serves the file at `/users.json`.

### Adult-content albums

Some albums redirect to iMGSRC.RU's one-click adult-content warning page
(`/main/warn.php`). The collector forwards the site's `over18=yeah` cookie —
as `X-Set-Cookie` to Jina Reader and as a request header in `cors-proxy.mjs` —
so those albums are read directly instead of stopping at the warning page. The
Playwright script sets the same cookie in its browser context.

Some albums also show a “foreword” page first (`…?preword=show`). It only has a
**Continue to album** form, so the collector detects that form and follows it
automatically before scanning.

## Command-line version

Playwright is already available in the workspace root. If you run this outside
the workspace:

```bash
npm install playwright
npx playwright install chromium
```

### Usage

```bash
node imgsrc-webp-album.mjs <album-url>
```

`<album-url>` can be any photo page of the album or the album's tape URL:

```bash
node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/86495337.html
node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/tape-2499131-73989830-0.html
```

The script starts at the album's initial view (for a `tape-…` input it derives
the first photo page), then finds the album's `tape-…` view automatically,
follows all of its pages, de-duplicates images, and writes `imgsrc-album.html`
(images are linked from the iMGSRC CDN).

### Options

| Option             | Description                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| `--out <file>`     | Output HTML file (default `imgsrc-album.html`)                                       |
| `--download [dir]` | Download the WEBP/GIF/JPG files to `dir` (default `webp`) and reference them locally |
| `--limit <n>`      | Stop after `n` images                                                                |
| `--headed`         | Show the browser window                                                              |
| `--slow <ms>`      | Slow down Playwright actions (debugging)                                             |

Examples:

```bash
# Download the files as well
node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/86495337.html --download

# Custom output file
node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/86495337.html --out torun.html

# Quick test with the first 10 images
node imgsrc-webp-album.mjs https://imgsrc.ru/verkeus/86495337.html --limit 10
```

## Output

The generated HTML is a responsive, dark-themed list of images with:

- numbered captions (original file name and dimensions),
- lazy loading,
- a lightbox (click an image, use ← / → and Esc),
- direct links to the full-size WEBP/GIF/JPG files,
- animated GIFs rendered as-is (no conversion to static images).
