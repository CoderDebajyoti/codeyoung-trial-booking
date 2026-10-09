import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
});

let dbConnected = true;
let lastDbCheck = 0;
const DB_CHECK_INTERVAL_MS = 15000; // Check DB connection every 15s if failed

export async function checkDbConnection(): Promise<boolean> {
  const now = Date.now();
  if (!dbConnected && now - lastDbCheck < DB_CHECK_INTERVAL_MS) {
    return false;
  }

  lastDbCheck = now;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    return true;
  } catch {
    dbConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return dbConnected;
}

export function markDbDisconnected(): void {
  dbConnected = false;
  lastDbCheck = Date.now();
}
