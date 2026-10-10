import { courseRepository, CreateCourseData, UpdateCourseData, UpsertPackageData } from '../repositories/course.repository.js';
import { Course, Package, CourseWithPackages } from '../types/models.js';

export class CourseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseValidationError';
  }
}

export class CourseService {
  async getAllCourses(includeInactive = false): Promise<CourseWithPackages[]> {
    return courseRepository.findAll(includeInactive);
  }

  async getCourseById(id: string): Promise<CourseWithPackages | null> {
    return courseRepository.findById(id);
  }

  async createCourse(data: CreateCourseData): Promise<Course> {
    if (!data.id || data.id.trim().length === 0) {
      throw new CourseValidationError('Course ID is required.');
    }
    if (!data.title || data.title.trim().length < 3) {
      throw new CourseValidationError('Course title must be at least 3 characters.');
    }
    if (!data.category || data.category.trim().length === 0) {
      throw new CourseValidationError('Course category is required.');
    }
    if (data.price !== undefined && data.price < 0) {
      throw new CourseValidationError('Course price cannot be negative.');
    }
    if (data.totalClasses !== undefined && data.totalClasses <= 0) {
      throw new CourseValidationError('Total classes must be a positive integer.');
    }
    if (data.classDuration !== undefined && data.classDuration <= 0) {
      throw new CourseValidationError('Class duration must be a positive integer.');
    }

    const existing = await courseRepository.findById(data.id);
    if (existing) {
      throw new CourseValidationError(`Course with ID "${data.id}" already exists.`);
    }

    return courseRepository.create(data);
  }

  async updateCourse(id: string, data: UpdateCourseData): Promise<Course> {
    if (data.price !== undefined && data.price < 0) {
      throw new CourseValidationError('Course price cannot be negative.');
    }
    if (data.totalClasses !== undefined && data.totalClasses <= 0) {
      throw new CourseValidationError('Total classes must be a positive integer.');
    }
    if (data.classDuration !== undefined && data.classDuration <= 0) {
      throw new CourseValidationError('Class duration must be a positive integer.');
    }

    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw new CourseValidationError(`Course with ID "${id}" not found.`);
    }

    return courseRepository.update(id, data);
  }

  async deleteCourse(id: string): Promise<Course> {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw new CourseValidationError(`Course with ID "${id}" not found.`);
    }
    return courseRepository.delete(id);
  }

  async upsertPackage(data: UpsertPackageData): Promise<Package> {
    if (data.classesCount <= 0) {
      throw new CourseValidationError('Package class count must be greater than zero.');
    }
    if (data.price < 0) {
      throw new CourseValidationError('Package price cannot be negative.');
    }
    if (data.durationMonths <= 0) {
      throw new CourseValidationError('Package duration months must be positive.');
    }

    const course = await courseRepository.findById(data.courseId);
    if (!course) {
      throw new CourseValidationError(`Referenced course "${data.courseId}" does not exist.`);
    }

    return courseRepository.upsertPackage(data);
  }

  async deletePackage(id: string): Promise<Package> {
    return courseRepository.deletePackage(id);
  }
}

export const courseService = new CourseService();
