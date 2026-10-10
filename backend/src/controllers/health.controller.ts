import { Request, Response } from 'express';
import { checkDbConnection } from '../lib/prisma.js';
import { isFallbackAllowed } from '../config/env.js';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const isConnected = await checkDbConnection();
  const fallbackAllowed = isFallbackAllowed();

  if (isConnected) {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'codeyoung-trial-booking-backend',
      uptime: process.uptime(),
      database: {
        status: 'connected',
        provider: 'postgresql',
        persistent: true,
      },
    });
    return;
  }

  if (fallbackAllowed) {
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      service: 'codeyoung-trial-booking-backend',
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        provider: 'in-memory-fallback',
        persistent: false,
        warning: 'Running in temporary in-memory fallback mode. Data will NOT persist across server restarts.',
      },
    });
    return;
  }

  res.status(503).json({
    status: 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'codeyoung-trial-booking-backend',
    uptime: process.uptime(),
    database: {
      status: 'disconnected',
      provider: 'postgresql',
      persistent: false,
      error: 'PostgreSQL database connection failed. Verify DATABASE_URL in backend/.env and check that PostgreSQL is running.',
    },
  });
};

