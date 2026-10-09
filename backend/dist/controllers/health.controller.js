"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const getHealth = (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'codeyoung-trial-booking-backend',
        uptime: process.uptime(),
    });
};
exports.getHealth = getHealth;
