import { registerAction, type WsClient } from "../actions.ts";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_API_URL = "http://localhost:1234/v1/chat/completions";
const MAX_HISTORY = 50;

const conversationHistory = new Map<string, ChatMessage[]>();

function getApiUrl(): string {
  return process.env.LLM_API_URL || DEFAULT_API_URL;
}

function getApiKey(): string {
  return process.env.LLM_API_KEY || "";
}

function getModel(): string {
  return process.env.LLM_MODEL || "";
}

function sendToClient(
  client: WsClient,
  action: string,
  data: Record<string, unknown>,
): void {
  client.ws.send(JSON.stringify({ action, data }));
}

function historyFor(client: WsClient): ChatMessage[] {
  const existing = conversationHistory.get(client.id);
  if (existing) {
    return existing;
  }
  const history: ChatMessage[] = [];
  conversationHistory.set(client.id, history);
  return history;
}

function trimHistory(history: ChatMessage[]): void {
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

function appendAssistant(client: WsClient, content: string): void {
  const history = historyFor(client);
  history.push({ role: "assistant", content });
  trimHistory(history);
}

function llmErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as { cause?: unknown }).cause;
    if (
      cause instanceof Error && cause.message && cause.message !== err.message
    ) {
      return `${err.message}: ${cause.message}`;
    }
    return err.message;
  }
  return "LLM request failed.";
}

async function streamChatCompletion(
  client: WsClient,
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<void> {
  const messageId = crypto.randomUUID();
  sendToClient(client, "llmStreamStart", { messageId });

  const body = {
    model: model || undefined,
    messages,
    stream: true,
  };

  const abortController = new AbortController();
  const abort = () => abortController.abort();

  const ws = client.ws;
  ws.on("close", abort);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      sendToClient(client, "error", {
        message: `LLM API error: ${response.status} ${response.statusText}`
          .trim(),
        detail,
      });
      return;
    }

    if (!response.body) {
      sendToClient(client, "error", {
        message: "LLM API returned no response body.",
      });
      return;
    }

    const reader = response.body.getReader();
    let buffer = "";
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += new TextDecoder().decode(value, { stream: true });

      let lineEnd: number;
      while ((lineEnd = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);

        if (!line.startsWith("data:")) {
          continue;
        }

        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          break;
        }

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }

        const choice = (parsed.choices as Record<string, unknown>[] | undefined)
          ?.[0];
        if (!choice) {
          continue;
        }

        const delta = choice.delta as { content?: string } | null;
        const content = delta?.content ?? "";

        if (content) {
          fullResponse += content;
          sendToClient(client, "llmStreamChunk", { messageId, content });
        }

        const finishReason = choice.finish_reason;
        if (finishReason === "stop" || finishReason === "length") {
          break;
        }
      }
    }

    if (fullResponse) {
      sendToClient(client, "llmStreamEnd", {
        messageId,
        fullResponse,
      });
    } else {
      sendToClient(client, "error", {
        message: "LLM API returned an empty streamed response.",
      });
    }
  } catch (err) {
    if (abortController.signal.aborted) {
      return;
    }
    throw err;
  } finally {
    ws.off("close", abort);
  }
}

async function chatCompletion(
  client: WsClient,
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<void> {
  const body = {
    model: model || undefined,
    messages,
    stream: false,
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    sendToClient(client, "error", {
      message: `LLM API error: ${response.status} ${response.statusText}`
        .trim(),
      detail,
    });
    return;
  }

  const parsed = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = parsed.choices?.[0]?.message?.content ?? "";
  if (!content) {
    sendToClient(client, "error", {
      message: "LLM API returned an empty response.",
    });
    return;
  }

  appendAssistant(client, content);
  sendToClient(client, "llmResponse", {
    content,
    messages: historyFor(client),
  });
}

function llmChat(
  client: WsClient,
  payload: Record<string, unknown>,
): void {
  const { stream, systemPrompt, clear, messages } = payload;

  if (clear) {
    conversationHistory.delete(client.id);
  }

  const history = historyFor(client);

  if (
    typeof systemPrompt === "string" &&
    systemPrompt.trim()
  ) {
    const prompt = systemPrompt.trim();
    const last = history[history.length - 1];
    if (last?.role !== "system" || last.content !== prompt) {
      history.push({ role: "system", content: prompt });
    }
  }

  if (!Array.isArray(messages)) {
    client.ws.send(
      JSON.stringify({
        action: "error",
        data: { message: "'messages' must be an array." },
      }),
    );
    return;
  }

  for (const message of messages) {
    const { role, content } = message as {
      role?: string;
      content?: string;
    };
    if (
      role !== "user" &&
      role !== "assistant" &&
      role !== "system"
    ) {
      client.ws.send(
        JSON.stringify({
          action: "error",
          data: { message: `Invalid role: ${String(role)}` },
        }),
      );
      return;
    }
    if (typeof content !== "string") {
      client.ws.send(
        JSON.stringify({
          action: "error",
          data: { message: "Each message must have a string 'content'." },
        }),
      );
      return;
    }
    history.push({ role, content });
  }

  trimHistory(history);

  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  const model = getModel();

  if (stream === false) {
    void chatCompletion(client, apiUrl, apiKey, model, history).catch((err) => {
      console.error("[llmChat] non-streaming error:", err);
      sendToClient(client, "error", { message: llmErrorMessage(err) });
    });
  } else {
    void streamChatCompletion(client, apiUrl, apiKey, model, history).catch(
      (err) => {
        console.error("[llmChat] streaming error:", err);
        sendToClient(client, "error", { message: llmErrorMessage(err) });
      },
    );
  }
}

registerAction("llmChat", llmChat);
