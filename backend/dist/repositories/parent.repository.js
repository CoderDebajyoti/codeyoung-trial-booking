"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentRepository = exports.ParentRepository = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const inMemoryStore_js_1 = require("../lib/inMemoryStore.js");
const env_js_1 = require("../config/env.js");
class ParentRepository {
    db;
    constructor(db = prisma_js_1.prisma) {
        this.db = db;
    }
    async findOrCreate(data, txDb) {
        const client = txDb || this.db;
        if (!(0, prisma_js_1.isDbConnected)() && client === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.findOrCreateParent(data);
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected. Cannot save parent record.');
        }
        try {
            const existing = await client.parent.findFirst({
                where: { email: data.email },
            });
            if (existing) {
                const updated = await client.parent.update({
                    where: { id: existing.id },
                    data: {
                        name: data.name,
                        phone: data.phone || existing.phone,
                        timeZone: data.timeZone,
                    },
                });
                (0, prisma_js_1.markDbConnected)();
                return updated;
            }
            const created = await client.parent.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    timeZone: data.timeZone,
                },
            });
            (0, prisma_js_1.markDbConnected)();
            return created;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.findOrCreateParent(data);
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to save parent record to database.');
        }
    }
    async findById(id) {
        if (!(0, prisma_js_1.isDbConnected)() && this.db === prisma_js_1.prisma) {
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.parents.find((p) => p.id === id) || null;
            }
            throw new prisma_js_1.DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve parent record.');
        }
        try {
            const parent = await this.db.parent.findUnique({
                where: { id },
            });
            (0, prisma_js_1.markDbConnected)();
            return parent;
        }
        catch (error) {
            (0, prisma_js_1.markDbDisconnected)(error);
            if ((0, env_js_1.isFallbackAllowed)()) {
                return inMemoryStore_js_1.inMemoryStore.parents.find((p) => p.id === id) || null;
            }
            throw new prisma_js_1.DatabaseConnectionError('Failed to fetch parent from database.');
        }
    }
}
exports.ParentRepository = ParentRepository;
exports.parentRepository = new ParentRepository();
