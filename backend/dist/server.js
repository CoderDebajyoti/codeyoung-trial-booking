"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const notification_service_js_1 = require("./services/notification.service.js");
const app = (0, app_js_1.createApp)();
const server = app.listen(env_js_1.env.PORT, () => {
    console.log(`🚀 Codeyoung Trial Booking Backend running on port ${env_js_1.env.PORT} [${env_js_1.env.NODE_ENV}]`);
    console.log(`🔗 Health check available at: http://localhost:${env_js_1.env.PORT}/api/health`);
    console.log(`✉️ Email provider: ${env_js_1.env.EMAIL_PROVIDER} (sender: ${env_js_1.env.EMAIL_FROM})`);
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
