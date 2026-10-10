import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DatabaseConnectionError } from '../lib/prisma.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors,
    });
    return;
  }

  if (err instanceof DatabaseConnectionError) {
    res.status(503).json({
      status: 'error',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Persistent database storage is currently unavailable. Please verify PostgreSQL service and credentials.',
    });
    return;
  }

  // Handle Prisma connection and authentication errors
  if (err && typeof err === 'object' && 'name' in err) {
    const errorName = (err as { name: string }).name;
    if (
      errorName === 'PrismaClientInitializationError' ||
      errorName === 'PrismaClientRustPanicError' ||
      errorName === 'PrismaClientUnknownRequestError'
    ) {
      res.status(503).json({
        status: 'error',
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service connection failed. Please ensure PostgreSQL is running and reachable.',
      });
      return;
    }
  }

  if (err instanceof Error) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}

