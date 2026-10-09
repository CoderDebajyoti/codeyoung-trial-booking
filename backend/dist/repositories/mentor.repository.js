"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorRepository = exports.MentorRepository = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const inMemoryStore_js_1 = require("../lib/inMemoryStore.js");
class MentorRepository {
    db;
    constructor(db = prisma_js_1.prisma) {
        this.db = db;
    }
    async findAllActive() {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.getMentors();
        }
        try {
            return await this.db.mentor.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.getMentors();
        }
    }
    async findById(id) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.getMentorById(id);
        }
        try {
            return await this.db.mentor.findUnique({
                where: { id },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.getMentorById(id);
        }
    }
    /**
     * Acquire explicit row-level locks on candidate mentors in sorted ID order to prevent race conditions / deadlocks.
     */
    async lockMentorsByIds(tx, mentorIds) {
        if (mentorIds.length === 0)
            return [];
        try {
            const sortedIds = [...mentorIds].sort();
            const query = `
        SELECT * FROM "mentors" 
        WHERE "id" = ANY($1::text[]) 
        ORDER BY "id" ASC 
        FOR UPDATE
      `;
            const lockedMentors = await tx.$queryRawUnsafe(query, sortedIds);
            return lockedMentors;
        }
        catch {
            return mentorIds.map((id) => inMemoryStore_js_1.inMemoryStore.getMentorById(id)).filter(Boolean);
        }
    }
}
exports.MentorRepository = MentorRepository;
exports.mentorRepository = new MentorRepository();
