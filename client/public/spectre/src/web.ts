import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { applyCoreMiddlewares, errorMiddleware, notFoundMiddleware } from './middlewares/index';
import { moduleRoutes } from './modules/index';
import { setupWebSocketServer } from './websocket';
import { actions } from './action-bus';

const publicDir = path.join(process.cwd(), 'public');

const app = express();
app.set('actions', actions);
const PORT = Number(process.env.WEB_PORT ?? 3001);

applyCoreMiddlewares(app, publicDir);

for (const route of moduleRoutes) {
  app.use(route);
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export const startWebServer = () => {
  const server = createServer(app);
  
  setupWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`Web UI running at http://localhost:${PORT}`);
  });
};
