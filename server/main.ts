import { createServer } from "node:http";
import { createApp } from "./src/app.ts";
import { wsManager } from "./src/lib/ws.ts";

const port = Number(process.env.PORT ?? 8421);

if (import.meta.main) {
  const app = createApp();
  const server = createServer(app);
  wsManager.attachServer(server);
  server.listen(port, () => {
    console.log(`mtCMS server listening on http://localhost:${port}`);
  });
}
