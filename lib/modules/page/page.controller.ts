import { RouterContext } from "@oak/oak/router";
import indexHtml from "./index.html" with { type: "text" };

export const showLandingPage = (ctx: RouterContext<"/">) => {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.status = 200;
  ctx.response.body = indexHtml;
};
