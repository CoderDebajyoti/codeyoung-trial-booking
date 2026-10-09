"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.checkDbConnection = checkDbConnection;
exports.isDbConnected = isDbConnected;
exports.markDbDisconnected = markDbDisconnected;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
});
let dbConnected = true;
let lastDbCheck = 0;
const DB_CHECK_INTERVAL_MS = 15000; // Check DB connection every 15s if failed
async function checkDbConnection() {
    const now = Date.now();
    if (!dbConnected && now - lastDbCheck < DB_CHECK_INTERVAL_MS) {
        return false;
    }
    lastDbCheck = now;
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        dbConnected = true;
        return true;
    }
    catch {
        dbConnected = false;
        return false;
    }
}
function isDbConnected() {
    return dbConnected;
}
function markDbDisconnected() {
    dbConnected = false;
    lastDbCheck = Date.now();
}
