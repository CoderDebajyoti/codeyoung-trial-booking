"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_js_1 = require("./config/env.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
function createApp() {
    const app = (0, express_1.default)();
    // Security headers & remove server fingerprint
    app.disable('x-powered-by');
    // Middleware
    app.use((0, cors_1.default)({
        origin: [env_js_1.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
    }));
    // Request body size limit to prevent memory exhaustion DoS
    app.use(express_1.default.json({ limit: '50kb' }));
    // Global API rate limiter
    app.use('/api', rateLimiter_js_1.globalRateLimiter);
    // API Routes
    app.use('/api', index_js_1.default);
    // Global Error Handler
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
