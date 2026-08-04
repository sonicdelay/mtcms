import { RouterContext } from "jsr:@oak/oak";
import openApiSpec from './openapi.yaml' with { type: "text" };
import indexHtml from "./index.html" with { type: "text" };

export const showOpenAPI = (ctx: RouterContext<"/">) => {
  //const cdnUrl = "https://cdn.jsdelivr.net";
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.status = 200;
  ctx.response.body = indexHtml;
};

export const renderOpenAPI = (ctx: RouterContext<"/openapi.yaml">) => {
  const hostingSystem = ctx.request.url.origin;
  // console.log(`Hosting system: ${hostingSystem}`);
  ctx.response.headers.set("Content-Type", "application/yaml");
  ctx.response.status = 200;
  ctx.response.body = openApiSpec;

};
