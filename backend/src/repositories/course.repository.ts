import { PrismaClient } from '@prisma/client';
import { Course, Package, CourseWithPackages } from '../types/models.js';
import { prisma as defaultPrisma, isDbConnected, markDbConnected, markDbDisconnected, DatabaseConnectionError } from '../lib/prisma.js';
import { inMemoryStore } from '../lib/inMemoryStore.js';
import { isFallbackAllowed } from '../config/env.js';

export interface CreateCourseData {
  id: string;
  title: string;
  category: string;
  shortDesc: string;
  ageGroup: string;
  classLevel?: string;
  outcomes: string;
  duration: string;
  totalClasses?: number;
  classDuration?: number;
  price?: number;
  currency?: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateCourseData {
  title?: string;
  category?: string;
  shortDesc?: string;
  ageGroup?: string;
  classLevel?: string;
  outcomes?: string;
  duration?: string;
  totalClasses?: number;
  classDuration?: number;
  price?: number;
  currency?: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpsertPackageData {
  id?: string;
  courseId: string;
  name: string;
  durationMonths: number;
  classesCount: number;
  price: number;
  currency?: string;
  discountPct?: number;
  isActive?: boolean;
}

export class CourseRepository {
  constructor(private db: PrismaClient = defaultPrisma) {}

  async findAll(includeInactive = false): Promise<CourseWithPackages[]> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        return inMemoryStore.courses
          .filter((c) => includeInactive || c.isActive)
          .map((c) => ({
            ...c,
            packages: inMemoryStore.packages.filter((p) => p.courseId === c.id && (includeInactive || p.isActive)),
          }));
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const courses = await this.db.course.findMany({
        where: includeInactive ? {} : { isActive: true },
        include: {
          packages: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { durationMonths: 'asc' },
          },
        },
        orderBy: [{ category: 'asc' }, { title: 'asc' }],
      });
      markDbConnected();
      return courses;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        return inMemoryStore.courses
          .filter((c) => includeInactive || c.isActive)
          .map((c) => ({
            ...c,
            packages: inMemoryStore.packages.filter((p) => p.courseId === c.id && (includeInactive || p.isActive)),
          }));
      }
      throw new DatabaseConnectionError('Failed to fetch courses from database.');
    }
  }

  async findById(id: string): Promise<CourseWithPackages | null> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        const c = inMemoryStore.courses.find((x) => x.id === id);
        if (!c) return null;
        return {
          ...c,
          packages: inMemoryStore.packages.filter((p) => p.courseId === c.id),
        };
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const course = await this.db.course.findUnique({
        where: { id },
        include: {
          packages: {
            orderBy: { durationMonths: 'asc' },
          },
        },
      });
      markDbConnected();
      return course;
    } catch (error) {
      markDbDisconnected(error);
      if (isFallbackAllowed()) {
        const c = inMemoryStore.courses.find((x) => x.id === id);
        if (!c) return null;
        return {
          ...c,
          packages: inMemoryStore.packages.filter((p) => p.courseId === c.id),
        };
      }
      throw new DatabaseConnectionError('Failed to fetch course from database.');
    }
  }

  async create(data: CreateCourseData): Promise<Course> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        const newCourse: Course = {
          id: data.id,
          title: data.title,
          category: data.category,
          shortDesc: data.shortDesc,
          ageGroup: data.ageGroup,
          classLevel: data.classLevel || null,
          outcomes: data.outcomes,
          duration: data.duration,
          totalClasses: data.totalClasses ?? 48,
          classDuration: data.classDuration ?? 60,
          price: data.price ?? 120,
          currency: data.currency || 'USD',
          icon: data.icon || 'Code',
          imageUrl: data.imageUrl || null,
          isActive: data.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryStore.courses.push(newCourse);
        return newCourse;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const course = await this.db.course.create({
        data: {
          id: data.id,
          title: data.title,
          category: data.category,
          shortDesc: data.shortDesc,
          ageGroup: data.ageGroup,
          classLevel: data.classLevel,
          outcomes: data.outcomes,
          duration: data.duration,
          totalClasses: data.totalClasses ?? 48,
          classDuration: data.classDuration ?? 60,
          price: data.price ?? 120,
          currency: data.currency || 'USD',
          icon: data.icon,
          imageUrl: data.imageUrl,
          isActive: data.isActive ?? true,
        },
      });
      markDbConnected();
      return course;
    } catch (error) {
      markDbDisconnected(error);
      throw new DatabaseConnectionError('Failed to create course in database.');
    }
  }

  async update(id: string, data: UpdateCourseData): Promise<Course> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        const c = inMemoryStore.courses.find((x) => x.id === id);
        if (!c) throw new Error(`Course not found: ${id}`);
        Object.assign(c, data, { updatedAt: new Date() });
        return c;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const course = await this.db.course.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      markDbConnected();
      return course;
    } catch (error) {
      markDbDisconnected(error);
      throw new DatabaseConnectionError('Failed to update course in database.');
    }
  }

  async delete(id: string): Promise<Course> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        const cIndex = inMemoryStore.courses.findIndex((x) => x.id === id);
        if (cIndex === -1) throw new Error(`Course not found: ${id}`);
        const [deleted] = inMemoryStore.courses.splice(cIndex, 1);
        return deleted!;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const deleted = await this.db.course.delete({
        where: { id },
      });
      markDbConnected();
      return deleted;
    } catch (error) {
      markDbDisconnected(error);
      throw new DatabaseConnectionError('Failed to delete course from database.');
    }
  }

  async upsertPackage(data: UpsertPackageData): Promise<Package> {
    const pkgId = data.id || `${data.courseId}-${data.durationMonths}m`;
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        const existing = inMemoryStore.packages.find((p) => p.id === pkgId);
        if (existing) {
          Object.assign(existing, data, { updatedAt: new Date() });
          return existing;
        }
        const newPkg: Package = {
          id: pkgId,
          courseId: data.courseId,
          name: data.name,
          durationMonths: data.durationMonths,
          classesCount: data.classesCount,
          price: data.price,
          currency: data.currency || 'USD',
          discountPct: data.discountPct ?? 0,
          isActive: data.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryStore.packages.push(newPkg);
        return newPkg;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const pkg = await this.db.package.upsert({
        where: { id: pkgId },
        update: {
          name: data.name,
          durationMonths: data.durationMonths,
          classesCount: data.classesCount,
          price: data.price,
          currency: data.currency || 'USD',
          discountPct: data.discountPct ?? 0,
          isActive: data.isActive ?? true,
          updatedAt: new Date(),
        },
        create: {
          id: pkgId,
          courseId: data.courseId,
          name: data.name,
          durationMonths: data.durationMonths,
          classesCount: data.classesCount,
          price: data.price,
          currency: data.currency || 'USD',
          discountPct: data.discountPct ?? 0,
          isActive: data.isActive ?? true,
        },
      });
      markDbConnected();
      return pkg;
    } catch (error) {
      markDbDisconnected(error);
      throw new DatabaseConnectionError('Failed to save package in database.');
    }
  }

  async deletePackage(id: string): Promise<Package> {
    if (!isDbConnected() && this.db === defaultPrisma) {
      if (isFallbackAllowed()) {
        const idx = inMemoryStore.packages.findIndex((p) => p.id === id);
        if (idx === -1) throw new Error(`Package not found: ${id}`);
        const [deleted] = inMemoryStore.packages.splice(idx, 1);
        return deleted!;
      }
      throw new DatabaseConnectionError('Persistent database storage is disconnected.');
    }

    try {
      const deleted = await this.db.package.delete({
        where: { id },
      });
      markDbConnected();
      return deleted;
    } catch (error) {
      markDbDisconnected(error);
      throw new DatabaseConnectionError('Failed to delete package from database.');
    }
  }
}

export const courseRepository = new CourseRepository();
