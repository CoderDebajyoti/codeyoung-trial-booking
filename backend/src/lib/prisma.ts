import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';


export class DatabaseConnectionError extends Error {
  public readonly code = 'DATABASE_UNAVAILABLE';
  constructor(
    message = 'Persistent database storage is currently unavailable. Please verify PostgreSQL connection and credentials.'
  ) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
});

let dbConnected = true;
let lastDbCheck = 0;
const DB_CHECK_INTERVAL_MS = 10000; // Check DB connection every 10s if failed

export function sanitizeDbError(error: unknown): string {
  const errorMsg = error instanceof Error ? error.message : String(error);
  // Strip credentials from any postgresql:// URL inside error strings
  return errorMsg.replace(/postgresql:\/\/([^:]+):([^@]+)@/gi, 'postgresql://$1:***@');
}

export async function checkDbConnection(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && !dbConnected && now - lastDbCheck < DB_CHECK_INTERVAL_MS) {
    return false;
  }

  lastDbCheck = now;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    return true;
  } catch (error) {
    dbConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return dbConnected;
}

export function markDbConnected(): void {
  dbConnected = true;
}

export function markDbDisconnected(error?: unknown): void {
  dbConnected = false;
  lastDbCheck = Date.now();
  if (error) {
    const sanitized = sanitizeDbError(error);
    console.error(`[Database Error] PostgreSQL connection failed: ${sanitized}`);
  }
}

