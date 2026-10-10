import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';

export function createApp(): Express {
  const app = express();

  // Security headers & remove server fingerprint
  app.disable('x-powered-by');

  // Middleware
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  // Request body size limit to prevent memory exhaustion DoS
  app.use(express.json({ limit: '50kb' }));

  // Global API rate limiter
  app.use('/api', globalRateLimiter);

  // API Routes
  app.use('/api', apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
