import { PrismaClient, Prisma } from '@prisma/client';
import { Mentor } from '../types/models.js';
import { prisma as defaultPrisma, isDbConnected, markDbConnected, markDbDisconnected, DatabaseConnectionError } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';
import { isFallbackAllowed } from '../config/env.js';

export class MentorRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findAllActive(): Promise<Mentor[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        console.warn('[WARN] Using in-memory fallback for findAllActive mentors.');
        return inMemoryStore.getMentors();
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve mentors.');
    }
    try {
      const mentors = await this.db.mentor.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      markDbConnected();
      return mentors;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        console.warn('[WARN] Database query failed; falling back to in-memory store for active mentors.');
        return inMemoryStore.getMentors();
      }
      throw new DatabaseConnectionError('Failed to fetch mentors from database.');
    }
  }

  async findById(id: string): Promise<Mentor | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.getMentorById(id);
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected. Cannot retrieve mentor.');
    }
    try {
      const mentor = await this.db.mentor.findUnique({
        where: { id },
      });
      markDbConnected();
      return mentor;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.getMentorById(id);
      }
      throw new DatabaseConnectionError('Failed to fetch mentor from database.');
    }
  }

  /**
   * Acquire explicit row-level locks on candidate mentors in sorted ID order to prevent race conditions / deadlocks.
   */
  async lockMentorsByIds(tx: Prisma.TransactionClient, mentorIds: string[]): Promise<Mentor[]> {
    if (mentorIds.length === 0) return [];
    
    const sortedIds = [...mentorIds].sort();
    try {
      if (process.env.DATABASE_URL?.startsWith('postgres')) {
        const query = `
          SELECT * FROM "mentors" 
          WHERE "id" = ANY($1::text[]) 
          ORDER BY "id" ASC 
          FOR UPDATE
        `;
        return await tx.$queryRawUnsafe<Mentor[]>(query, sortedIds);
      }
      return await tx.mentor.findMany({
        where: { id: { in: sortedIds } },
        orderBy: { id: 'asc' },
      });
    } catch (error) {
      if (isFallbackAllowed()) {
        return mentorIds.map((id) => inMemoryStore.getMentorById(id)).filter(Boolean) as Mentor[];
      }
      throw error;
    }
  }
}

export const mentorRepository = new MentorRepository();


