"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.errors,
        });
        return;
    }
    if (err instanceof prisma_js_1.DatabaseConnectionError) {
        res.status(503).json({
            status: 'error',
            code: 'DATABASE_UNAVAILABLE',
            message: 'Persistent database storage is currently unavailable. Please verify PostgreSQL service and credentials.',
        });
        return;
    }
    // Handle Prisma connection and authentication errors
    if (err && typeof err === 'object' && 'name' in err) {
        const errorName = err.name;
        if (errorName === 'PrismaClientInitializationError' ||
            errorName === 'PrismaClientRustPanicError' ||
            errorName === 'PrismaClientUnknownRequestError') {
            res.status(503).json({
                status: 'error',
                code: 'DATABASE_UNAVAILABLE',
                message: 'Database service connection failed. Please ensure PostgreSQL is running and reachable.',
            });
            return;
        }
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
