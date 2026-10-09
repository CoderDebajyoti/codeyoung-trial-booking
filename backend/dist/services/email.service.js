"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.SmtpEmailService = exports.MockEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = require("../config/env.js");
const dateUtils_js_1 = require("../lib/dateUtils.js");
class MockEmailService {
    sentEmails = [];
    getSentEmails() {
        return [...this.sentEmails];
    }
    clearSentEmails() {
        this.sentEmails = [];
    }
    async sendBookingConfirmation(params) {
        const parentLocalStart = (0, dateUtils_js_1.formatLocalTime)(params.startAtUtc, params.parentTimeZone, 'yyyy-MM-dd HH:mm (zzz)');
        const parentLocalEnd = (0, dateUtils_js_1.formatLocalTime)(params.endAtUtc, params.parentTimeZone, 'HH:mm (zzz)');
        const mentorLocalStart = (0, dateUtils_js_1.formatLocalTime)(params.startAtUtc, params.mentorTimeZone, 'yyyy-MM-dd HH:mm (zzz)');
        const mentorLocalEnd = (0, dateUtils_js_1.formatLocalTime)(params.endAtUtc, params.mentorTimeZone, 'HH:mm (zzz)');
        // 1. Parent Confirmation Email
        const parentEmail = {
            to: params.parentEmail,
            from: env_js_1.env.EMAIL_FROM,
            subject: `Codeyoung Booking Confirmed: 1:1 Trial Class (${params.course})`,
            text: [
                `Dear ${params.parentName},`,
                '',
                `Your 1:1 live trial class for "${params.course}" has been confirmed!`,
                '',
                `📅 Date & Time (Your Local Time): ${parentLocalStart} - ${parentLocalEnd}`,
                `🌍 Time Zone: ${params.parentTimeZone}`,
                `👨‍🏫 Assigned Mentor: ${params.mentorName}`,
                `🔗 Live Class Meeting Link: ${params.demoClassUrl}`,
                `🔖 Booking Reference: ${params.bookingId}`,
                '',
                'Please join 5 minutes before the scheduled time.',
                '',
                'Warm regards,',
                'Codeyoung Team',
            ].join('\n'),
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #2563eb;">Your 1:1 Live Trial Class is Confirmed!</h2>
          <p>Dear <strong>${params.parentName}</strong>,</p>
          <p>Your trial class for <strong>${params.course}</strong> is scheduled with Mentor <strong>${params.mentorName}</strong>.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date & Time (Your Local Time):</strong> ${parentLocalStart} - ${parentLocalEnd}</p>
            <p><strong>🌍 Your Time Zone:</strong> ${params.parentTimeZone}</p>
            <p><strong>👨‍🏫 Mentor:</strong> ${params.mentorName}</p>
            <p><strong>🔖 Booking Reference:</strong> ${params.bookingId}</p>
            <p><strong>🔗 Class Link:</strong> <a href="${params.demoClassUrl}" style="color: #2563eb; font-weight: bold;">Join Live Demo Class</a></p>
          </div>
          <p>Warm regards,<br><strong>Codeyoung Team</strong></p>
        </div>
      `,
            sentAt: new Date(),
            recipientRole: 'parent',
            bookingId: params.bookingId,
        };
        // 2. Mentor Notification Email
        const mentorEmail = {
            to: params.mentorEmail,
            from: env_js_1.env.EMAIL_FROM,
            subject: `New 1:1 Trial Class Scheduled: ${params.course} with ${params.parentName}`,
            text: [
                `Dear ${params.mentorName},`,
                '',
                `A new 1:1 trial class has been assigned to you for "${params.course}".`,
                '',
                `📅 Date & Time (Your Local Time): ${mentorLocalStart} - ${mentorLocalEnd}`,
                `🌍 Time Zone: ${params.mentorTimeZone}`,
                `👤 Student / Parent: ${params.parentName} (${params.parentEmail})`,
                `🔗 Live Class Meeting Link: ${params.demoClassUrl}`,
                `🔖 Booking Reference: ${params.bookingId}`,
                '',
                'Warm regards,',
                'Codeyoung Academic Operations',
            ].join('\n'),
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #4f46e5;">New 1:1 Trial Class Assigned</h2>
          <p>Dear <strong>${params.mentorName}</strong>,</p>
          <p>You have a new trial class session scheduled for <strong>${params.course}</strong>.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date & Time (Your Local Time):</strong> ${mentorLocalStart} - ${mentorLocalEnd}</p>
            <p><strong>🌍 Your Time Zone:</strong> ${params.mentorTimeZone}</p>
            <p><strong>👤 Parent:</strong> ${params.parentName} (${params.parentEmail})</p>
            <p><strong>🔖 Booking Reference:</strong> ${params.bookingId}</p>
            <p><strong>🔗 Class Link:</strong> <a href="${params.demoClassUrl}" style="color: #4f46e5; font-weight: bold;">Enter Live Meeting Room</a></p>
          </div>
          <p>Warm regards,<br><strong>Codeyoung Academic Operations</strong></p>
        </div>
      `,
            sentAt: new Date(),
            recipientRole: 'mentor',
            bookingId: params.bookingId,
        };
        this.sentEmails.push(parentEmail, mentorEmail);
        if (env_js_1.env.NODE_ENV !== 'test') {
            console.log(`✉️ [Mock Email] Sent Parent Confirmation to: ${params.parentEmail} (${parentLocalStart})`);
            console.log(`✉️ [Mock Email] Sent Mentor Notification to: ${params.mentorEmail} (${mentorLocalStart})`);
        }
        return true;
    }
}
exports.MockEmailService = MockEmailService;
class SmtpEmailService {
    mockFallback = new MockEmailService();
    transporter;
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: env_js_1.env.SMTP_HOST || 'localhost',
            port: env_js_1.env.SMTP_PORT || 1025,
            secure: false,
            auth: env_js_1.env.SMTP_USER && env_js_1.env.SMTP_PASS
                ? {
                    user: env_js_1.env.SMTP_USER,
                    pass: env_js_1.env.SMTP_PASS,
                }
                : undefined,
        });
    }
    getSentEmails() {
        return this.mockFallback.getSentEmails();
    }
    clearSentEmails() {
        this.mockFallback.clearSentEmails();
    }
    async sendBookingConfirmation(params) {
        // Record into in-memory audit log as well
        await this.mockFallback.sendBookingConfirmation(params);
        const parentLocalStart = (0, dateUtils_js_1.formatLocalTime)(params.startAtUtc, params.parentTimeZone, 'yyyy-MM-dd HH:mm (zzz)');
        const parentLocalEnd = (0, dateUtils_js_1.formatLocalTime)(params.endAtUtc, params.parentTimeZone, 'HH:mm (zzz)');
        const mentorLocalStart = (0, dateUtils_js_1.formatLocalTime)(params.startAtUtc, params.mentorTimeZone, 'yyyy-MM-dd HH:mm (zzz)');
        const mentorLocalEnd = (0, dateUtils_js_1.formatLocalTime)(params.endAtUtc, params.mentorTimeZone, 'HH:mm (zzz)');
        try {
            // Send to parent
            await this.transporter.sendMail({
                from: env_js_1.env.EMAIL_FROM,
                to: params.parentEmail,
                subject: `Codeyoung Booking Confirmed: 1:1 Trial Class (${params.course})`,
                text: `Hello ${params.parentName},\n\nYour 1:1 Trial Class is confirmed for ${parentLocalStart} - ${parentLocalEnd} (${params.parentTimeZone}).\nMeeting Link: ${params.demoClassUrl}`,
            });
            // Send to mentor
            await this.transporter.sendMail({
                from: env_js_1.env.EMAIL_FROM,
                to: params.mentorEmail,
                subject: `New 1:1 Trial Class Assigned: ${params.course} with ${params.parentName}`,
                text: `Hello ${params.mentorName},\n\nA trial class has been scheduled for ${mentorLocalStart} - ${mentorLocalEnd} (${params.mentorTimeZone}).\nMeeting Link: ${params.demoClassUrl}`,
            });
            return true;
        }
        catch (error) {
            console.warn('⚠️ SMTP Email Transport unreachable, preserved in-memory notification log:', error);
            return false;
        }
    }
}
exports.SmtpEmailService = SmtpEmailService;
exports.emailService = env_js_1.env.EMAIL_ADAPTER === 'smtp' || env_js_1.env.EMAIL_ADAPTER === 'mailpit'
    ? new SmtpEmailService()
    : new MockEmailService();
