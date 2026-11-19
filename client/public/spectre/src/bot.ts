import TelegramBot, { Message } from 'node-telegram-bot-api';
import { logger } from './logger.ts';

const broadcast = true;

const ids = [
  { name: "HessiBoy", username: "7802946531", id: "6803801182" },
];

export const createBot = (sendToLLM: (message: string, userName?: string) => Promise<string>) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set. Add it to your .env file.');
  }

  const bot = new TelegramBot(token, { polling: true, timeout: 10 });

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
  });

  bot.on('error', (error) => {
    console.error('Telegram bot error:', error.message);
  });

  bot.onText(/\/echo (.+)/i, (msg: Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const resp = match?.[0];
    if (!resp) {
      bot.sendMessage(chatId, 'Please provide text after /echo');
      return;
    }
    bot.sendMessage(chatId, resp);
  });

  bot.on('message', (msg: Message) => {
    const chatId = msg.chat.id;
    const message = msg.text;

    console.log(`${chatId} ->: ${msg.text}`);
    logger(`${msg.chat.id} - ${msg.from?.username || 'unknown user'} - ${msg.text}`);

    sendToLLM(message, msg.from?.first_name).then((response) => {
      console.log(`<-: ${response}`);
      console.log(`------------------------------`);
      if (broadcast) {
        bot.sendMessage(chatId, response);
      }
    }).catch((error) => {
      logger(`${chatId} - Error communicating with Agent: ${error}`);
      console.error('Error communicating with Agent:', error);
      bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
    });
  });

  const sendMessageToAll = (message: string) => {
    ids.forEach((user) => {
      bot.sendMessage(user.id, message);
    });
  };

  return { bot, sendMessageToAll };
};
