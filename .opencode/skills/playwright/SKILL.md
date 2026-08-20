---
name: playwright
description: A powerful library for automating web browsers (Chromium, Firefox, WebKit). Use this skill when the task requires interacting with a live webpage, such as clicking buttons, filling forms, or scraping content.
---

## What I do
- Automate web browsers (Chromium, Firefox, WebKit) for testing and scraping
- Perform actions like clicking buttons, filling forms, navigating pages, and taking screenshots
- Extract and assert on page content, attributes, and network requests

## When to use me
Use this skill when you need to interact with a live webpage — automating form submissions, scraping dynamic content, running browser tests, or capturing page state. Prefer this over static HTML analysis when JavaScript rendering is required.

## Capabilities
- `page.goto(url)` — navigate to a URL
- `page.click(selector)` — click an element
- `page.fill(selector, value)` — fill a form field
- `page.screenshot()` — capture a screenshot
- `page.content()` — get full page HTML
- `page.evaluate(fn)` — run JavaScript in the page context
- `page.locator(selector).textContent()` — get element text
- `page.waitForSelector(selector)` — wait for an element to appear

## Example
```javascript
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
const title = await page.title();
console.log(title);
await browser.close();
```

