import { Router } from 'express';
import {
  getLoginController,
  getRefreshController,
  postLoginController,
  postRefreshController
} from './controller.ts';

const prefix = '/api/auth';

export const authRouter = Router();

authRouter.get(`${prefix}/login`, getLoginController);
authRouter.post(`${prefix}/login`, postLoginController);
authRouter.get(`${prefix}/refresh`, getRefreshController);
authRouter.post(`${prefix}/refresh`, postRefreshController);