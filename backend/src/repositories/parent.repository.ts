import { PrismaClient, Parent, Prisma } from '@prisma/client';
import { prisma as defaultPrisma, isDbConnected, markDbDisconnected } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';

export class ParentRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findOrCreate(
    data: { name: string; email: string; phone?: string; timeZone: string },
    txDb?: Prisma.TransactionClient
  ): Promise<Parent> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      return inMemoryStore.findOrCreateParent(data);
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
    } catch {
      markDbDisconnected();
      return inMemoryStore.findOrCreateParent(data);
    }
  }

  async findById(id: string): Promise<Parent | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      return inMemoryStore.parents.find((p) => p.id === id) || null;
    }
    try {
      return await this.db.parent.findUnique({
        where: { id },
      });
    } catch {
      markDbDisconnected();
      return inMemoryStore.parents.find((p) => p.id === id) || null;
    }
  }
}

export const parentRepository = new ParentRepository();
