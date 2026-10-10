import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma, markDbConnected, markDbDisconnected } from '../../src/lib/prisma.js';

describe('GET /api/health', () => {
  const originalEnv = process.env.ALLOW_IN_MEMORY_FALLBACK;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.ALLOW_IN_MEMORY_FALLBACK = originalEnv;
    markDbConnected();
  });

  it('should return 200 OK with service details and database status when connected', async () => {
    vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ 1: 1 }] as unknown as never);
    markDbConnected();

    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'codeyoung-trial-booking-backend');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toHaveProperty('status', 'connected');
    expect(response.body.database).toHaveProperty('persistent', true);
  });

  it('should return 200 degraded when database is disconnected and fallback is allowed', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('Connection refused'));
    process.env.ALLOW_IN_MEMORY_FALLBACK = 'true';
    markDbDisconnected();
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'degraded');
    expect(response.body.database).toHaveProperty('status', 'disconnected');
    expect(response.body.database).toHaveProperty('provider', 'in-memory-fallback');
  });

  it('should return 503 unhealthy when database is disconnected and fallback is disabled', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('Connection refused'));
    process.env.ALLOW_IN_MEMORY_FALLBACK = 'false';
    markDbDisconnected();
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'unhealthy');
    expect(response.body.database).toHaveProperty('status', 'disconnected');
    expect(response.body.database).toHaveProperty('persistent', false);
  });
});


