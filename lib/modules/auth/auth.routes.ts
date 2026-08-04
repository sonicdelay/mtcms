import { Router } from "jsr:@oak/oak";
import { authenticateByEmail, refreshToken } from "./auth.controller.ts";

const router = new Router();

router
  .prefix("/api/auth")
  .get("/", refreshToken)
  .post("/", authenticateByEmail);

export default router;
