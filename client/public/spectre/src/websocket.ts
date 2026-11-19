import type { Server } from 'http';
import { WebSocketServer } from 'ws';
import { sendToLLM } from './llm.ts';
import { logger } from './logger.ts';

export const setupWebSocketServer = (server: Server): void => {
  const wsServer = new WebSocketServer({ server, path: '/ws' });

  wsServer.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));

    socket.on('message', async (rawPayload) => {
      try {
        const payload = JSON.parse(rawPayload.toString()) as { message?: unknown; userName?: unknown; thinking?: unknown };
        const message = typeof payload.message === 'string' ? payload.message : null;
        const userName = typeof payload.userName === 'string' ? payload.userName : undefined;
        const thinking = typeof payload.thinking === 'string' ? payload.thinking : undefined;

        if (!message) {
          socket.send(JSON.stringify({ type: 'error', error: 'message is required' }));
          return;
        }

        const reply = await sendToLLM(message, userName, thinking);
        socket.send(JSON.stringify({ type: 'reply', reply }));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger(`WebSocket error: ${msg}`);
        socket.send(JSON.stringify({ type: 'error', error: msg }));
      }
    });
  });
};