"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_service_js_1 = require("../services/email.service.js");
const router = (0, express_1.Router)();
router.get('/recent', (_req, res) => {
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
