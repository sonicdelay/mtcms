import { Router } from "express";
import { postChatController } from "./controller.ts";

const prefix = "/api/chat";

export const chatRouter = Router();

chatRouter.post(prefix, postChatController);
