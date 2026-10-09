"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentRepository = exports.ParentRepository = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const inMemoryStore_js_1 = require("../lib/inMemoryStore.js");
class ParentRepository {
    db;
    constructor(db = prisma_js_1.prisma) {
        this.db = db;
    }
    async findOrCreate(data, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.findOrCreateParent(data);
        }
        try {
            const existing = await client.parent.findFirst({
                where: { email: data.email },
            });
            if (existing) {
                return await client.parent.update({
                    where: { id: existing.id },
                    data: {
                        name: data.name,
                        phone: data.phone || existing.phone,
                        timeZone: data.timeZone,
                    },
                });
            }
            return await client.parent.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    timeZone: data.timeZone,
                },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.findOrCreateParent(data);
        }
    }
    async findById(id) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            return inMemoryStore_js_1.inMemoryStore.parents.find((p) => p.id === id) || null;
        }
        try {
            return await this.db.parent.findUnique({
                where: { id },
            });
        }
        catch {
            (0, prisma_js_1.markDbDisconnected)();
            return inMemoryStore_js_1.inMemoryStore.parents.find((p) => p.id === id) || null;
        }
    }
}
exports.ParentRepository = ParentRepository;
exports.parentRepository = new ParentRepository();
