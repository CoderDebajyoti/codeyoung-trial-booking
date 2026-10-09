"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_js_1 = __importDefault(require("./health.routes.js"));
const mentor_routes_js_1 = __importDefault(require("./mentor.routes.js"));
const slot_routes_js_1 = __importDefault(require("./slot.routes.js"));
const booking_routes_js_1 = __importDefault(require("./booking.routes.js"));
const email_routes_js_1 = __importDefault(require("./email.routes.js"));
const apiRouter = (0, express_1.Router)();
apiRouter.use('/health', health_routes_js_1.default);
apiRouter.use('/mentors', mentor_routes_js_1.default);
apiRouter.use('/slots', slot_routes_js_1.default);
apiRouter.use('/bookings', booking_routes_js_1.default);
apiRouter.use('/emails', email_routes_js_1.default);
exports.default = apiRouter;
