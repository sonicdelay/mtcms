import express from "express";
import { type AuthenticatedRequest, authRequired } from "../lib/auth.ts";
import { AuthError, login, refresh } from "../lib/auth.service.ts";
import { problem } from "../lib/http.ts";

export const authRouter = express.Router();

authRouter.post(
  "/",
  express.urlencoded({ extended: true }),
  express.json(),
  async (req, res) => {
    const email = (req.body as Record<string, unknown> | undefined)?.email;
    const password = (req.body as Record<string, unknown> | undefined)
      ?.password;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      problem(res, 400, "Bad Request", "email and password are required.");
      return;
    }

    try {
      res.json(await login(email, password));
    } catch (error) {
      if (error instanceof AuthError) {
        problem(res, 401, "Unauthorized", "Invalid email or password.");
        return;
      }
      problem(res, 500, "Internal Server Error", (error as Error).message);
    }
  },
);

authRouter.get("/", authRequired, async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  try {
    res.json(await refresh(user));
  } catch (error) {
    problem(res, 500, "Internal Server Error", (error as Error).message);
  }
});
