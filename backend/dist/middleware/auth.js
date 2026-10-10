"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMentorOrAdmin = exports.requireRole = exports.authenticate = void 0;
const jwt_js_1 = require("../lib/jwt.js");
/**
 * Validates JWT Bearer token on incoming requests.
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]?.trim();
    }
    if (!token) {
        res.status(401).json({
            status: 'fail',
            message: 'Authentication required. Please log in with company credentials.',
        });
        return;
    }
    try {
        const payload = (0, jwt_js_1.verifyUserToken)(token);
        req.user = payload;
        next();
    }
    catch (err) {
        res.status(401).json({
            status: 'fail',
            message: 'Invalid or expired session. Please log in again.',
        });
    }
};
exports.authenticate = authenticate;
/**
 * Enforces role-based authorization for protected routes.
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                status: 'fail',
                message: 'Authentication required.',
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                status: 'fail',
                message: 'Access forbidden. You do not have permission to access this resource.',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Restricts mentor schedule inspection to the authenticated mentor themselves or an administrator.
 */
const requireMentorOrAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            status: 'fail',
            message: 'Authentication required.',
        });
        return;
    }
    if (req.user.role === 'ADMIN') {
        next();
        return;
    }
    const requestedMentorId = req.params.id;
    if (req.user.role === 'MENTOR' && req.user.mentorId === requestedMentorId) {
        next();
        return;
    }
    res.status(403).json({
        status: 'fail',
        message: "Access forbidden. Mentors may only access their own private schedule.",
    });
};
exports.requireMentorOrAdmin = requireMentorOrAdmin;
