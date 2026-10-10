"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.DatabaseConnectionError = void 0;
exports.sanitizeDbError = sanitizeDbError;
exports.checkDbConnection = checkDbConnection;
exports.isDbConnected = isDbConnected;
exports.markDbConnected = markDbConnected;
exports.markDbDisconnected = markDbDisconnected;
const client_1 = require("@prisma/client");
const env_js_1 = require("../config/env.js");
class DatabaseConnectionError extends Error {
    code = 'DATABASE_UNAVAILABLE';
    constructor(message = 'Persistent database storage is currently unavailable. Please verify PostgreSQL connection and credentials.') {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}
exports.DatabaseConnectionError = DatabaseConnectionError;
exports.prisma = new client_1.PrismaClient({
    log: env_js_1.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
});
let dbConnected = true;
let lastDbCheck = 0;
const DB_CHECK_INTERVAL_MS = 10000; // Check DB connection every 10s if failed
function sanitizeDbError(error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // Strip credentials from any postgresql:// URL inside error strings
    return errorMsg.replace(/postgresql:\/\/([^:]+):([^@]+)@/gi, 'postgresql://$1:***@');
}
async function checkDbConnection(force = false) {
    const now = Date.now();
    if (!force && !dbConnected && now - lastDbCheck < DB_CHECK_INTERVAL_MS) {
        return false;
    }
    lastDbCheck = now;
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        dbConnected = true;
        return true;
    }
    catch (error) {
        dbConnected = false;
        return false;
    }
}
function isDbConnected() {
    return dbConnected;
}
function markDbConnected() {
    dbConnected = true;
}
function markDbDisconnected(error) {
    dbConnected = false;
    lastDbCheck = Date.now();
    if (error) {
        const sanitized = sanitizeDbError(error);
        console.error(`[Database Error] PostgreSQL connection failed: ${sanitized}`);
    }
}
