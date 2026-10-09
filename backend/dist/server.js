"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const app = (0, app_js_1.createApp)();
const server = app.listen(env_js_1.env.PORT, () => {
    console.log(`🚀 Codeyoung Trial Booking Backend running on port ${env_js_1.env.PORT} [${env_js_1.env.NODE_ENV}]`);
    console.log(`🔗 Health check available at: http://localhost:${env_js_1.env.PORT}/api/health`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
