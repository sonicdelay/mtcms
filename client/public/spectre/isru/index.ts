import { firefox, Page } from 'playwright';

const userUrl = "https://imgsrc.ru/vita50";

(async () => {
  const browser = await firefox.launch();  // Or 'chromium' or 'webkit'.
  const page = await browser.newPage();
  await page.goto(userUrl);

  // get all anchor hrefs on the page
  const links: string[] = await page.$$eval(
    'a[href]',
    (anchors, { userUrl }) =>
      Array.from(anchors)
        .map((a) => (a instanceof HTMLAnchorElement ? a.href : ''))
        .filter(Boolean)
        .filter((href) => href.startsWith(userUrl))
        .filter((href) => href.endsWith(userUrl) || href.startsWith(`${userUrl}/`))
        ,  
    { userUrl }
  );

  // print unique links
  const unique = Array.from(new Set(links));
  console.log(JSON.stringify(unique, null, 2));

  // traverse all albums
  const imageUrls = new Set<string>();

  for (const albumUrl of unique) {

    console.log(`Processing album: ${albumUrl}`);

    await page.goto(albumUrl);


    // get all pages in the album
    const pages: string[] = await page.$$eval(
      'a[href]',
      (anchors) => {
        console.log(anchors);
        const urls = new Set<string>();
        const pagePattern = /[?&]p=(\d+)/i;
        const anchorElements = Array.from(anchors).filter(
          (anchor): anchor is HTMLAnchorElement => anchor instanceof HTMLAnchorElement
        );

        anchorElements.forEach((a) => {
          const href = a.href;
          if (href.match(pagePattern)) {
            urls.add(href);
          }
        });
        return Array.from(urls);
      }
    );

    console.log(pages);

    
    console.log(JSON.stringify(pages, null, 2));
    const pageUrls = pages.length > 0 ? pages : [albumUrl];

    // traverse all pages and extract image links
    for (const pageUrl of pageUrls) {
      await page.goto(pageUrl);
      const images: string[] = await page.$$eval(
        'a[href] img, img[src]',
        (elements) => {
          const urls = new Set<string>();
          Array.from(elements).forEach((el) => {
            if (el instanceof HTMLImageElement && el.src) {
              urls.add(el.src);
            } else if (el.parentElement instanceof HTMLAnchorElement) {
              urls.add(el.parentElement.href);
            }
          });
          return Array.from(urls);
        }
      );
      images.forEach((img) => imageUrls.add(img));
    }
  }

console.log(`Found ${imageUrls.size} unique image URLs:`);
console.log(JSON.stringify(Array.from(imageUrls), null, 2));

  console.log(JSON.stringify(Array.from(imageUrls), null, 2));

  await browser.close();
})();

// declare const require: any;
// declare const module: any;
// declare const process: any;

// type AlbumResult = {
//   title: string;
//   url: string;
//   pages: string[];
//   fullImagePageLinks: string[];
// };

// type UserScrapeResult = {
//   userUrl: string;
//   albums: AlbumResult[];
// };

// type AlbumLink = {
//   title: string;
//   url: string;
// };

// async function extractAlbumLinks(page: Page, userUrl: string): Promise<AlbumLink[]> {
//   const url = new URL(userUrl);
//   const origin = url.origin;
//   const normalizedUserPath = url.pathname.replace(/\/+$|^\/|\/$/g, '');
//   const userPath = normalizedUserPath.length ? `/${normalizedUserPath}` : '';

//   return await page.$$eval(
//     'a[href]',
//     (anchors, { origin, userPath }) => {
//       const seen = new Set<string>();
//       const anchorElements = Array.from(anchors).filter(
//         (anchor): anchor is HTMLAnchorElement => anchor instanceof HTMLAnchorElement
//       );

//       return anchorElements
//         .map((a) => ({ href: a.href, title: a.textContent?.trim() ?? '' }))
//         .filter((link) => {
//           if (!link.href.startsWith(origin)) return false;
//           try {
//             const urlObj = new URL(link.href);
//             const path = urlObj.pathname.replace(/\/+$|^\/|\/$/g, '');
//             const normalizedBase = userPath.replace(/\/+$|^\/|\/$/g, '');
//             if (!path.startsWith(normalizedBase)) return false;
//             const relative = path.slice(normalizedBase.length).replace(/^\//, '');
//             if (!relative || relative.includes('/')) return false;
//             if (seen.has(link.href)) return false;
//             seen.add(link.href);
//             return true;
//           } catch {
//             return false;
//           }
//         });
//     },
//     { origin, userPath }
//   );
// }

// async function extractAlbumImagePages(page: Page, albumUrl: string): Promise<AlbumResult> {
//   await page.goto(albumUrl, { waitUntil: 'domcontentloaded' });
//   const url = new URL(albumUrl);
//   const origin = url.origin;
//   const albumPath = url.pathname.replace(/\/+$|^\/|\/$/g, '');
//   const safeAlbumPath = albumPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//   const pages = await page.$$eval(
//     'a[href]',
//     (anchors, { origin, safeAlbumPath, albumPath }) => {
//       const urls = new Set<string>();
//       const pagePattern = new RegExp(`${safeAlbumPath}[?&]p=(\\d+)`, 'i');
//       const anchorElements = Array.from(anchors).filter(
//         (anchor): anchor is HTMLAnchorElement => anchor instanceof HTMLAnchorElement
//       );

//       anchorElements.forEach((anchor) => {
//         const href = anchor.href;
//         if (!href.startsWith(origin)) return;
//         const match = href.match(pagePattern);
//         if (match) {
//           urls.add(href);
//         }
//       });

//       if (urls.size === 0) {
//         urls.add(`${origin}/${albumPath}`);
//       }

//       return Array.from(urls);
//     },
//     { origin, safeAlbumPath, albumPath }
//   );

//   const pageUrls = Array.from(new Set(pages));
//   const fullImagePageLinks = new Set<string>();

//   for (const pageUrl of pageUrls) {
//     await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
//     const links = await page.$$eval(
//       'a[href]',
//       (anchors, { origin, albumPath }) => {
//         const found = new Set<string>();
//         const anchorElements = Array.from(anchors).filter(
//           (anchor): anchor is HTMLAnchorElement => anchor instanceof HTMLAnchorElement
//         );

//         anchorElements.forEach((anchor) => {
//           const href = anchor.href;
//           if (!href.startsWith(origin)) return;
//           if (href === document.location.href) return;
//           if (!href.includes(albumPath)) return;
//           if (anchor.querySelector('img')) {
//             found.add(href);
//           }
//         });

//         return Array.from(found);
//       },
//       { origin, albumPath }
//     );
//     links.forEach((link) => fullImagePageLinks.add(link));
//   }

//   return {
//     title: albumUrl.split('/').filter(Boolean).pop() ?? albumUrl,
//     url: albumUrl,
//     pages: pageUrls,
//     fullImagePageLinks: Array.from(fullImagePageLinks),
//   };
// }

// export async function scrapeImgsrcUser(userUrl: string): Promise<UserScrapeResult> {
//   const browser = await chromium.launch({ headless: true });
//   const page = await browser.newPage();
//   await page.goto(userUrl, { waitUntil: 'domcontentloaded' });

//   const albumRefs = await extractAlbumLinks(page, userUrl);
//   const albums: AlbumResult[] = [];

//   for (const albumRef of albumRefs) {
//     const albumResult = await extractAlbumImagePages(page, albumRef.url);
//     albums.push(albumResult);
//   }

//   await browser.close();
//   return { userUrl, albums };
// }

// if (require.main === module) {
//   const userUrl = "https://imgsrc.ru/amordepapi";//process.argv[2] || 'https://imgsrc.ru/maxilla-k';
//   scrapeImgsrcUser(userUrl)
//     .then((result) => {
//       console.log(JSON.stringify(result, null, 2));
//     })
//     .catch((error) => {
//       console.error(error);
//       process.exit(1);
//     });
// }
