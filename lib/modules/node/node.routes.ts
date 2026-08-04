import { Router } from "jsr:@oak/oak";
import {
  createNode,
  deleteNode,
  readAllNodes,
  readNodeById,
  updateNode,
} from "./nodes.controller.ts";

const router = new Router();
router
  .prefix("/api/node")
  .get("/", readAllNodes)
  .post("/", createNode)
  .get("/:id", readNodeById)
  .put("/:id", updateNode)
  .delete("/:id", deleteNode);

export default router;
