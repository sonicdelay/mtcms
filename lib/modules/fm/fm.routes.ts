import { Router, RouterContext } from "jsr:@oak/oak";
import {
  deleteContent,
  getContent,
  postContent,
  putContent,
} from "./fm.controller.ts";

export const router = new Router();

router
  .prefix("/api/fm")
  .get(``, getContent)
  .get(`/`, getContent)
  .get(`/:path*`, getContent)
  .put(`/:path*`, putContent)
  .post(`/:path*`, postContent)
  .delete(`/:path*`, deleteContent);

export default router;
