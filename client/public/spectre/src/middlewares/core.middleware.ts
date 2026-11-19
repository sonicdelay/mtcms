import cors from 'cors';
import express from 'express';
import type { Express } from 'express';

export const applyCoreMiddlewares = (app: Express, staticDir: string): void => {
  const rawCorsOrigin = process.env.CORS_ORIGIN?.trim();
  const allowedOrigins = rawCorsOrigin
    ? rawCorsOrigin.split(',').map((origin) => origin.trim()).filter((origin) => origin.length > 0)
    : ['*'];

  app.disable('x-powered-by');
  app.use(cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(express.static(staticDir));
};