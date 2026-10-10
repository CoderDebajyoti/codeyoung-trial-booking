"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_service_js_1 = require("../services/email.service.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protected: Only administrators can audit the raw in-memory sent emails
router.get('/recent', auth_js_1.authenticate, (0, auth_js_1.requireRole)(['ADMIN']), (_req, res) => {
    const sentEmails = email_service_js_1.emailService.getSentEmails();
    res.status(200).json({
        status: 'success',
        data: {
            totalSent: sentEmails.length,
            emails: sentEmails,
        },
    });
});
exports.default = router;
