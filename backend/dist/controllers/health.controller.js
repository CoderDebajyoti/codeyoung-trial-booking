"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const env_js_1 = require("../config/env.js");
const getHealth = async (_req, res) => {
    const isConnected = await (0, prisma_js_1.checkDbConnection)();
    const fallbackAllowed = (0, env_js_1.isFallbackAllowed)();
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
exports.getHealth = getHealth;
