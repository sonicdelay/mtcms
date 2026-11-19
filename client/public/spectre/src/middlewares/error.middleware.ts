import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logger.ts';

export const notFoundMiddleware = (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'route not found' });
};

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  const message = error instanceof Error ? error.message : String(error);
  logger(`Web server error: ${message}`);
  res.status(500).json({ error: 'internal server error' });
};