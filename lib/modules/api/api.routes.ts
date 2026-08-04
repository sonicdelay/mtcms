import { Router } from "@oak/oak";
import { renderOpenAPI, showOpenAPI } from "./api.controller.ts";

const router = new Router();

router
  .prefix("/api")
  .get("/", showOpenAPI)
  .get("/openapi.yaml", renderOpenAPI);

export default router;
