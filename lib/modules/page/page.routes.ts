import { Router } from "jsr:@oak/oak";
import { showLandingPage } from "./page.controller.ts";

const router = new Router();

router
  .prefix("/")
  .get("/", showLandingPage)

export default router;
