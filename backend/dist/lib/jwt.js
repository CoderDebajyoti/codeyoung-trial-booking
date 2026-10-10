"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUserToken = signUserToken;
exports.verifyUserToken = verifyUserToken;
exports.signEmailVerificationToken = signEmailVerificationToken;
exports.verifyEmailVerificationToken = verifyEmailVerificationToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
function signUserToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_js_1.env.JWT_SECRET, {
        expiresIn: env_js_1.env.JWT_EXPIRES_IN,
    });
}
function verifyUserToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
    }
    catch (err) {
        throw new Error('Invalid or expired authentication token');
    }
}
function signEmailVerificationToken(email) {
    return jsonwebtoken_1.default.sign({ email: email.toLowerCase().trim(), type: 'EMAIL_VERIFIED' }, env_js_1.env.JWT_SECRET, {
        expiresIn: '30m',
    });
}
function verifyEmailVerificationToken(token, expectedEmail) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
        return (payload.type === 'EMAIL_VERIFIED' &&
            payload.email.toLowerCase().trim() === expectedEmail.toLowerCase().trim());
    }
    catch {
        return false;
    }
}
