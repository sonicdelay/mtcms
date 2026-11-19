import { Router } from "express";
import {
  createNodeController,
  deleteNodeController,
  getNodeByIdController,
  getNodesInfoController,
  listNodesController,
  updateNodeController
} from "./controller.ts";

const prefix = "/api/nodes";

export const nodeRouter = Router();

nodeRouter.get(`${prefix}/info`, getNodesInfoController);
nodeRouter.get(`${prefix}`, listNodesController);
nodeRouter.get(`${prefix}/:id`, getNodeByIdController);
nodeRouter.post(`${prefix}`, createNodeController);
nodeRouter.put(`${prefix}/:id`, updateNodeController);
nodeRouter.delete(`${prefix}/:id`, deleteNodeController);
