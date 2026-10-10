"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const notification_service_js_1 = require("./services/notification.service.js");
const prisma_js_1 = require("./lib/prisma.js");
const app = (0, app_js_1.createApp)();
const server = app.listen(env_js_1.env.PORT, () => {
    console.log(`🚀 Codeyoung Trial Booking Backend running on port ${env_js_1.env.PORT} [${env_js_1.env.NODE_ENV}]`);
    console.log(`🔗 Health check available at: http://localhost:${env_js_1.env.PORT}/api/health`);
    console.log(`✉️ Email provider: ${env_js_1.env.EMAIL_PROVIDER} (sender: ${env_js_1.env.EMAIL_FROM})`);
    // Probe database connection on startup
    (0, prisma_js_1.checkDbConnection)(true).then((connected) => {
        if (connected) {
            console.log('✅ PostgreSQL connected successfully (persistent storage active).');
        }
        else {
            console.error('❌ PostgreSQL connection failed! Please verify DATABASE_URL in backend/.env.');
            if (!(0, env_js_1.isFallbackAllowed)()) {
                console.error('⚠️ Persistent storage is required (ALLOW_IN_MEMORY_FALLBACK=false). Database operations will return 503.');
            }
            else {
                console.warn('⚠️ Running in fallback mode (ALLOW_IN_MEMORY_FALLBACK=true). Bookings will NOT persist across restarts.');
            }
        }
    });
    // Start background outbox and 30-min reminder worker
    notification_service_js_1.notificationService.startWorker();
});
const gracefulShutdown = () => {
    console.log('Stopping server and notification workers...');
    notification_service_js_1.notificationService.stopWorker();
    server.close(() => {
        console.log('HTTP server closed');
    });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
