"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mentor_controller_js_1 = require("../controllers/mentor.controller.js");
const router = (0, express_1.Router)();
router.get('/', mentor_controller_js_1.getMentors);
router.get('/:id/schedule', mentor_controller_js_1.getMentorSchedule);
exports.default = router;
