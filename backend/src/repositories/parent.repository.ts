import { PrismaClient, Prisma } from '@prisma/client';
import { Parent } from '../types/models.js';
import { prisma as defaultPrisma, isDbConnected, markDbConnected, markDbDisconnected, DatabaseConnectionError } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';
import { isFallbackAllowed } from '../config/env.js';

export class ParentRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findOrCreate(
    data: { name: string; email: string; phone?: string; timeZone: string },
    txDb?: Prisma.TransactionClient
  ): Promise<Parent> {
    const client = txDb || this.db;
    if (!isDbConnected() && client === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.findOrCreateParent(data);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot save parent record.');
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
        markDbConnected();
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
      markDbConnected();
      return created;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.findOrCreateParent(data);
      }
      throw new DatabaseConnectionError('Failed to save parent record to database.');
    }
  }

  async findById(id: string): Promise<Parent | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.parents.find((p) => p.id === id) || null;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve parent record.');
    }
    try {
      const parent = await this.db.parent.findUnique({
        where: { id },
      });
      markDbConnected();
      return parent;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.parents.find((p) => p.id === id) || null;
      }
      throw new DatabaseConnectionError('Failed to fetch parent from database.');
    }
  }
}

export const parentRepository = new ParentRepository();


