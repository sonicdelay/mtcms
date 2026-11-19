import { chromium } from 'playwright';
import type { ToolPlugin } from './index.ts';

export const openBrowserPlugin: ToolPlugin = {
  name: 'open_browser',

  definition: {
    type: 'function',
    function: {
      name: 'open_browser',
      description: 'Open a URL with Playwright and return the page title.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Absolute URL to open, for example https://example.com'
          },
          waitMs: {
            type: 'number',
            description: 'Optional time to keep the page open before closing (500 to 10000).'
          }
        },
        required: ['url'],
        additionalProperties: false
      }
    }
  },

  async run(rawArguments: string) {
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
    let shouldAutoClose = false;

    try {
      const parsed = JSON.parse(rawArguments || '{}') as { url?: string; waitMs?: number };

      if (!parsed.url) {
        return { ok: false, error: 'Missing required argument: url' };
      }

      let normalizedUrl: string;
      try {
        normalizedUrl = new URL(parsed.url).toString();
      } catch {
        return { ok: false, error: `Invalid URL: ${parsed.url}` };
      }

      const hasWaitMs = parsed.waitMs !== undefined && parsed.waitMs !== null;
      const waitMs = hasWaitMs
        ? Math.min(Math.max(Number(parsed.waitMs), 500), 10000)
        : undefined;
      shouldAutoClose = hasWaitMs;

      browser = await chromium.launch({ headless: false, slowMo: 75 });
      const page = await browser.newPage();
      await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

      if (waitMs !== undefined) {
        await page.waitForTimeout(waitMs);
      }

      const title = await page.title();

      return {
        ok: true,
        url: normalizedUrl,
        title,
        waitedMs: waitMs,
        autoClosed: shouldAutoClose
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: message };
    } finally {
      if (browser && shouldAutoClose) {
        await browser.close().catch(() => undefined);
      }
    }
  }
};
