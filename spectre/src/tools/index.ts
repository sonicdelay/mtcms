import type { ToolPlugin } from "../models/tool-plugin.interface.ts";
import { openBrowserPlugin } from "./open-browser.ts";
import { googleSearchPlugin } from "./google-search.ts";
import { systemTimePlugin } from "./system-time.ts";

export type { ToolPlugin } from "../models/tool-plugin.interface.ts";

export const plugins: ToolPlugin[] = [
  openBrowserPlugin,
  googleSearchPlugin,
  systemTimePlugin
];
