import express from "express";
import {
  getArticleContent,
  listArticleDirWithTitles,
  resolveArticlePath,
} from "../lib/articles.service.ts";
import { problem } from "../lib/http.ts";

export const articlesRouter = express.Router();

async function handleGet(req: express.Request, res: express.Response) {
  const raw = (req.params as Record<string, unknown>).splat;
  const splat = Array.isArray(raw)
    ? raw.join("/")
    : typeof raw === "string"
    ? raw
    : "";
  const segments = splat.split("/").filter(Boolean);

  const result = await resolveArticlePath(segments);
  if (!result) {
    problem(res, 404, "Not Found", "Article not found.");
    return;
  }

  if (result.type === "dir") {
    res.json(await listArticleDirWithTitles(result.relPath));
    return;
  }

  const content = await getArticleContent(result.relPath);
  if (content === null) {
    problem(res, 404, "Not Found", "Article not found.");
    return;
  }

  res.set("Content-Type", "text/markdown; charset=utf-8").send(content);
}

articlesRouter.get("/", handleGet);
articlesRouter.get("/*splat", handleGet);
