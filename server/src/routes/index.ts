import type { Router } from "express";
import { apiRouter } from "./api.ts";
import { articlesRouter } from "./articles.ts";
import { authRouter } from "./auth.ts";
import { fmRouter } from "./fm.ts";
import { nodesRouter } from "./nodes.ts";


export const routers: Router[] = [
  authRouter,
  nodesRouter,
  fmRouter,
  articlesRouter,
  apiRouter,
];
