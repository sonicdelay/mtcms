import { chromium } from 'playwright';
import type { ToolPlugin } from './index.ts';

export const googleSearchPlugin: ToolPlugin = {
  name: 'google_search',

  definition: {
    type: 'function',
    function: {
      name: 'google_search',
      description: 'Search Google for a query and return the top results with titles, URLs, and snippets.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up on Google.'
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return (1 to 10, default 5).'
          }
        },
        required: ['query'],
        additionalProperties: false
      }
    }
  },

  async run(rawArguments: string) {
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

    try {
      const parsed = JSON.parse(rawArguments || '{}') as { query?: string; maxResults?: number };

      if (!parsed.query) {
        return { ok: false, error: 'Missing required argument: query' };
      }

      const maxResults = Math.min(Math.max(Number(parsed.maxResults ?? 5), 1), 10);

      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(parsed.query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const results = await page.evaluate((limit: number) => {
        const items: { title: string; url: string; snippet: string }[] = [];
        const elements = document.querySelectorAll('div.g');

        for (const el of elements) {
          if (items.length >= limit) break;

          const anchor = el.querySelector('a[href]');
          const titleEl = el.querySelector('h3');
          const snippetEl = el.querySelector('div[data-sncf], div.VwiC3b, span.aCOpRe');

          if (anchor && titleEl) {
            items.push({
              title: titleEl.textContent?.trim() ?? '',
              url: (anchor as HTMLAnchorElement).href,
              snippet: snippetEl?.textContent?.trim() ?? ''
            });
          }
        }

        return items;
      }, maxResults);

      return {
        ok: true,
        query: parsed.query,
        resultCount: results.length,
        results
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: message };
    } finally {
      if (browser) {
        await browser.close().catch(() => undefined);
      }
    }
  }
};
