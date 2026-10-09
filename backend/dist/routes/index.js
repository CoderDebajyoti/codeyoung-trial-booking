"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_js_1 = __importDefault(require("./health.routes.js"));
const apiRouter = (0, express_1.Router)();
apiRouter.use('/health', health_routes_js_1.default);
exports.default = apiRouter;
