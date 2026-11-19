import dotenv from 'dotenv';
import { sendToLLM } from './llm.ts';
import { createBot } from './bot.ts';
import { startWebServer } from './web.ts';

dotenv.config();
//createBot(sendToLLM);
startWebServer();
