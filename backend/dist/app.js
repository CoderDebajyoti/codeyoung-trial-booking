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
function createApp() {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({
        origin: [env_js_1.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
    }));
    app.use(express_1.default.json());
    // API Routes
    app.use('/api', index_js_1.default);
    // Global Error Handler
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
