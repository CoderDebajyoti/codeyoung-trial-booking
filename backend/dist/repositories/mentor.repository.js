"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorRepository = exports.MentorRepository = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const inMemoryStore_js_1 = require("../lib/inMemoryStore.js");
const env_js_1 = require("../config/env.js");
class MentorRepository {
    db;
    constructor(db = prisma_js_1.prisma) {
        this.db = db;
    }
    async findAllActive() {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                console.warn('[WARN] Using in-memory fallback for findAllActive mentors.');
                return inMemoryStore_js_1.inMemoryStore.getMentors();
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve mentors.');
        }
        try {
            const mentors = await this.db.mentor.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
            (0, prisma_js_1.markDbConnected)();
            return mentors;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                console.warn('[WARN] Database query failed; falling back to in-memory store for active mentors.');
                return inMemoryStore_js_1.inMemoryStore.getMentors();
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to fetch mentors from database.');
        }
    }
    async findById(id) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.getMentorById(id);
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve mentor.');
        }
        try {
            const mentor = await this.db.mentor.findUnique({
                where: { id },
            });
            (0, prisma_js_1.markDbConnected)();
            return mentor;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.getMentorById(id);
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to fetch mentor from database.');
        }
    }
    /**
     * Acquire explicit row-level locks on candidate mentors in sorted ID order to prevent race conditions / deadlocks.
     */
    async lockMentorsByIds(tx, mentorIds) {
        if (mentorIds.length === 0)
            return [];
        const sortedIds = [...mentorIds].sort();
        try {
            if (process.env.DATABASE_URL?.startsWith('postgres')) {
                const query = `
          SELECT * FROM "mentors" 
          WHERE "id" = ANY($1::text[]) 
          ORDER BY "id" ASC 
          FOR UPDATE
        `;
                return await tx.$queryRawUnsafe(query, sortedIds);
            }
            return await tx.mentor.findMany({
                where: { id: { in: sortedIds } },
                orderBy: { id: 'asc' },
            });
        }
        catch (error) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return mentorIds.map((id) => inMemoryStore_js_1.inMemoryStore.getMentorById(id)).filter(Boolean);
            }
            throw error;
        }
    }
}
exports.MentorRepository = MentorRepository;
exports.mentorRepository = new MentorRepository();
