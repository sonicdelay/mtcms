import OpenAI from "openai";
import { getUserPersonaContext, persona } from "./persona.ts";
import { plugins } from "./tools/index.ts";
import { logger } from "./logger.ts";

const modelName = "gemma-4-e4b-uncensored-hauhaucs-aggressive";

const serverUrls: string[] = [
  "http://192.168.178.27:1234/v1",
  "http://127.0.0.1:1234/v1"
];

const createClient = (baseURL: string) =>
  new OpenAI({
    baseURL,
    apiKey: "lm-studio"
  });

const runWithFallback = async <T>(
  operation: (client: OpenAI) => Promise<T>
): Promise<T> => {
  for (const url of serverUrls) {
    const client = createClient(url);

    try {
      logger(`Trying LLM server: ${url}`);
      return await operation(client);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger(`LLM server unavailable at ${url}: ${message}`);
    }
  }

  throw new Error("no LLM found");
};

const tools = plugins.map((p) => p.definition);
const toolMap = new Map(plugins.map((p) => [p.name, p]));

console.log(
  `Registered tools: ${tools.map((t) => t.function.name).join(", ")}`
);

// const isTimeIntent = (message: string) => {
//   const text = message.toLowerCase();
//   return /(wie\s*sp(ae|ä)t|uhrzeit|aktuelle\s*zeit|welche\s*uhr|datum|date|what\s*time|current\s*time)/i.test(text);
// };

const thinkingInstructions: Record<string, string> = {
  low: "Answer briefly and directly.",
  medium: "Think step by step, then answer concisely.",
  high: "Think deeply and thoroughly. Consider edge cases, explain your reasoning in detail."
};

export const sendToLLM = async (
  message: string,
  userName?: string,
  thinking?: string
) => {
  logger(`Request to LLM: ${message} [thinking=${thinking ?? "none"}]`);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: persona }
  ];

  if (thinking && thinkingInstructions[thinking]) {
    messages.push({ role: "system", content: thinkingInstructions[thinking] });
  }

  const userPersonaContext = getUserPersonaContext(userName);
  if (userPersonaContext) {
    messages.push({
      role: "system",
      content: userPersonaContext
    });
  }

  if (userName) {
    messages.push({
      role: "system",
      content: `Active user: ${userName}`
    });
  }

  messages.push({
    role: "user",
    content: message
  });

  // const forceSystemTime = isTimeIntent(message);

  const firstResponse = await runWithFallback((client) =>
    client.chat.completions.create({
      model: modelName,
      messages,
      tools,
      // tool_choice: forceSystemTime
      //   ? { type: 'function', function: { name: 'system_time' } }
      //   : 'auto'
      tool_choice: "auto"
    })
  );

  const assistantMessage = firstResponse.choices[0]?.message;
  if (!assistantMessage) {
    throw new Error("No assistant message returned by model.");
  }

  messages.push({
    role: "assistant",
    content: assistantMessage.content ?? "",
    tool_calls: assistantMessage.tool_calls
  });

  const toolCalls = assistantMessage.tool_calls ?? [];

  for (const toolCall of toolCalls) {
    let toolResult: Record<string, unknown>;

    if (toolCall.type !== "function") {
      toolResult = {
        ok: false,
        error: `Unsupported tool call type: ${toolCall.type}`
      };
    } else {
      const plugin = toolMap.get(toolCall.function.name);
      toolResult = plugin
        ? await plugin.run(toolCall.function.arguments)
        : { ok: false, error: `Unknown tool: ${toolCall.function.name}` };
    }

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResult)
    });
  }

  if (toolCalls.length > 0) {
    const finalResponse = await runWithFallback((client) =>
      client.chat.completions.create({
        model: modelName,
        messages
      })
    );

    const finalContent =
      finalResponse.choices[0]?.message?.content ??
      "Tool executed, but no final text was returned.";
    logger(`Response from Agent: ${finalContent}`);
    return finalContent;
  }

  const directContent = assistantMessage.content ?? "";
  logger(`Response from Agent: ${directContent}`);
  return directContent;
};
