import { Request, Response } from "express";
import { sendToLLM } from "../../llm.ts";
import { logger } from "../../logger.ts";

export const postChatController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body as {
    message?: unknown;
    userName?: unknown;
    thinking?: unknown;
  };
  const message = typeof body.message === "string" ? body.message : null;
  const userName =
    typeof body.userName === "string" ? body.userName : undefined;
  const thinking =
    typeof body.thinking === "string" ? body.thinking : undefined;

  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    const reply = await sendToLLM(message, userName, thinking);
    res.json({ reply });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger(`Web API error: ${msg}`);
    res.status(502).json({ error: msg });
  }
};
