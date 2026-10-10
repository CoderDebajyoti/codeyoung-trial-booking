"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mentor_controller_js_1 = require("../controllers/mentor.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Public listing of active mentors (names & timezones)
router.get('/', mentor_controller_js_1.getMentors);
// Protected mentor schedule inspection: restricted to the mentor themselves or administrator
router.get('/:id/schedule', auth_js_1.authenticate, auth_js_1.requireMentorOrAdmin, mentor_controller_js_1.getMentorSchedule);
exports.default = router;
