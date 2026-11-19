import type { ToolPlugin } from "./index.ts";

export const systemTimePlugin: ToolPlugin = {
  name: "system_time",

  definition: {
    type: "function",
    function: {
      name: "system_time",
      description: "Return the current date and time from the host machine.",
      parameters: {
        type: "object",
        properties: {
          locale: {
            type: "string",
            description:
              "Optional BCP 47 locale, for example en-US or de-DE, used for localized formatting."
          },
          timeZone: {
            type: "string",
            description:
              "Optional IANA timezone, for example Europe/Berlin, used for localized formatting."
          }
        },
        additionalProperties: false
      }
    }
  },

  async run(rawArguments: string) {
    try {
      const parsed = JSON.parse(rawArguments || "{}") as {
        locale?: string;
        timeZone?: string;
      };

      const now = new Date();
      const defaultLocale = "de-DE";
      const defaultTimeZone = "Europe/Berlin";
      const requestedLocale = parsed.locale?.trim();
      const effectiveLocale = requestedLocale || defaultLocale;
      const requestedTimeZone = parsed.timeZone?.trim();
      const effectiveTimeZone = requestedTimeZone || defaultTimeZone;

      let localized: string;
      let resolvedTimeZone = effectiveTimeZone;
      try {
        localized = new Intl.DateTimeFormat(effectiveLocale, {
          dateStyle: "full",
          timeStyle: "long",
          timeZone: effectiveTimeZone
        }).format(now);
      } catch {
        resolvedTimeZone = defaultTimeZone;
        localized = new Intl.DateTimeFormat(effectiveLocale, {
          dateStyle: "full",
          timeStyle: "long",
          timeZone: defaultTimeZone
        }).format(now);
      }

      return {
        ok: true,
        iso: now.toISOString(),
        unixMs: now.getTime(),
        local: now.toString(),
        localized,
        locale: effectiveLocale,
        timeZone: resolvedTimeZone
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: message };
    }
  }
};
