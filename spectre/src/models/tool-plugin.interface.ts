import type OpenAI from "openai";

export interface ToolPlugin {
  name: string;
  definition: OpenAI.Chat.Completions.ChatCompletionTool;
  run: (rawArguments: string) => Promise<Record<string, unknown>>;
}
