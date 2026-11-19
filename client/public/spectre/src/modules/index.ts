import { authRouter } from './auth/route.ts';
import { chatRouter } from './chat/route.ts';
import { fileManagerRouter } from './filemanager/route.ts';
import { nodeRouter } from './nodes/route.ts';

export const moduleRoutes = [authRouter, chatRouter, fileManagerRouter, nodeRouter];