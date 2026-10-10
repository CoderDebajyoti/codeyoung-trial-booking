"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_js_1 = require("../lib/jwt.js");
const mentor_service_js_1 = require("./mentor.service.js");
const DEFAULT_MENTOR_PASSWORD_HASH = bcryptjs_1.default.hashSync('Mentor@Codeyoung2026!', 10);
const DEFAULT_ADMIN_PASSWORD_HASH = bcryptjs_1.default.hashSync('Admin@Codeyoung2026!', 10);
class AuthService {
    users = [
        {
            id: 'admin-1',
            email: 'admin@codeyoung.com',
            name: 'System Administrator',
            role: 'ADMIN',
            passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
        },
    ];
    constructor() {
        this.initMentorAccounts();
    }
    async initMentorAccounts() {
        try {
            const mentors = await mentor_service_js_1.mentorService.getActiveMentors();
            for (const m of mentors) {
                if (!this.users.find((u) => u.email.toLowerCase() === m.email.toLowerCase())) {
                    this.users.push({
                        id: `user-${m.id}`,
                        email: m.email.toLowerCase(),
                        name: m.name,
                        role: 'MENTOR',
                        mentorId: m.id,
                        passwordHash: DEFAULT_MENTOR_PASSWORD_HASH,
                    });
                }
            }
        }
        catch {
            // Mentors will be populated lazily on login if DB connection initializes later
        }
    }
    async findUserByEmail(email) {
        const normalized = email.toLowerCase().trim();
        let user = this.users.find((u) => u.email.toLowerCase() === normalized);
        if (!user) {
            // Check if it's one of the mentors from mentorService
            const mentors = await mentor_service_js_1.mentorService.getActiveMentors();
            const mentor = mentors.find((m) => m.email.toLowerCase() === normalized);
            if (mentor) {
                user = {
                    id: `user-${mentor.id}`,
                    email: mentor.email.toLowerCase(),
                    name: mentor.name,
                    role: 'MENTOR',
                    mentorId: mentor.id,
                    passwordHash: DEFAULT_MENTOR_PASSWORD_HASH,
                };
                this.users.push(user);
            }
        }
        return user || null;
    }
    async login(email, candidatePassword) {
        const user = await this.findUserByEmail(email);
        if (!user) {
            // Constant-time comparison simulation to prevent timing enumeration attacks
            await bcryptjs_1.default.compare(candidatePassword, DEFAULT_MENTOR_PASSWORD_HASH);
            throw new Error('Invalid email address or password.');
        }
        const isValid = await bcryptjs_1.default.compare(candidatePassword, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid email address or password.');
        }
        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mentorId: user.mentorId,
        };
        const token = (0, jwt_js_1.signUserToken)(payload);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                mentorId: user.mentorId,
            },
        };
    }
    async getUserById(id) {
        const user = this.users.find((u) => u.id === id);
        if (!user)
            return null;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            mentorId: user.mentorId,
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
