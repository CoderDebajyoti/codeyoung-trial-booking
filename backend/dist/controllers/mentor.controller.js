"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMentorSchedule = exports.getMentors = void 0;
const mentor_service_js_1 = require("../services/mentor.service.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
const getMentors = async (_req, res, next) => {
    try {
        const mentors = await mentor_service_js_1.mentorService.getActiveMentors();
        res.status(200).json({
            status: 'success',
            data: {
                totalMentors: mentors.length,
                mentors: mentors.map((m) => ({
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    timeZone: m.timeZone,
                    workDays: (0, dateUtils_js_1.parseWorkDays)(m.workDays),
                    workStartHour: m.workStartHour,
                    workEndHour: m.workEndHour,
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMentors = getMentors;
const getMentorSchedule = async (req, res, next) => {
    try {
        const mentorId = req.params.id;
        const dateQuery = req.query.date;
        if (!mentorId) {
            res.status(400).json({ status: 'fail', message: 'Mentor ID is required' });
            return;
        }
        if (!dateQuery) {
            res.status(400).json({ status: 'fail', message: 'Query parameter date (YYYY-MM-DD) is required' });
            return;
        }
        const schedule = await mentor_service_js_1.mentorService.getMentorSchedule(mentorId, dateQuery);
        res.status(200).json({
            status: 'success',
            data: schedule,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMentorSchedule = getMentorSchedule;
