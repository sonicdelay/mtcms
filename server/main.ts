import { createApp } from "./src/app.ts";

const port = Number(process.env.PORT ?? 8421);

if (import.meta.main) {
  const app = createApp();
  app.listen(port, () => {
    console.log(`mtCMS server listening on http://localhost:${port}`);
  });
}
