"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.errors,
        });
        return;
    }
    if (err instanceof Error) {
        res.status(500).json({
            status: 'error',
            message: err.message,
        });
        return;
    }
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
}
