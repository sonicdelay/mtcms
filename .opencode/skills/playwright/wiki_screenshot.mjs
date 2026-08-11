import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('https://en.wikipedia.org/wiki/Main_Page', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'wikipedia.png', fullPage: false });
await browser.close();
console.log('Screenshot saved to wikipedia.png');
