import { Router } from "express";
import {
  createFileController,
  deleteFileController,
  getFileByIdController,
  getFileManagerInfoController,
  listFilesController,
  updateFileController
} from "./controller.ts";

export const fileManagerRouter = Router();

const prefix = "/api/fm";

fileManagerRouter
  .get(`${prefix}/`, getFileManagerInfoController)
  .get(`${prefix}/files`, listFilesController)
  .get(`${prefix}/files/*id`, getFileByIdController)
  .post(`${prefix}/files`, createFileController)
  .put(`${prefix}/files/*id`, updateFileController)
  .delete(`${prefix}/files/*id`, deleteFileController);
