import type { Request, Response, Router } from "express";
import express from "express";
import {
  getArticleContent,
  listArticleDirWithTitles,
  resolveArticlePath,
} from "../lib/articles.service.ts";
import { problem } from "../lib/http.ts";

const getArticles = async (req: Request, res: Response) => {
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
};

const prefix = "/api/articles";
export const articlesRouter: Router = express.Router();
articlesRouter
  .get(`${prefix}/`, getArticles)
  .get(`${prefix}/*splat`, getArticles);
