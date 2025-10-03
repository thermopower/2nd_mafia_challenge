import { z } from 'zod';

// Enums and constants
export const CourseSortBy = {
  Latest: 'latest',
  Popular: 'popular',
} as const;

export const CourseCategory = {
  Development: 'development',
  Design: 'design',
  Business: 'business',
  Marketing: 'marketing',
  PersonalDevelopment: 'personal-development',
} as const;

export const CourseDifficulty = {
  Beginner: 'beginner',
  Intermediate: 'intermediate',
  Advanced: 'advanced',
} as const;

// Request schemas
export const CourseCatalogQuerySchema = z.object({
  search: z.string().optional(),
  category: z
    .enum([
      CourseCategory.Development,
      CourseCategory.Design,
      CourseCategory.Business,
      CourseCategory.Marketing,
      CourseCategory.PersonalDevelopment,
    ])
    .optional(),
  difficulty: z
    .enum([
      CourseDifficulty.Beginner,
      CourseDifficulty.Intermediate,
      CourseDifficulty.Advanced,
    ])
    .optional(),
  sortBy: z.enum([CourseSortBy.Latest, CourseSortBy.Popular]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CourseCatalogQuery = z.infer<typeof CourseCatalogQuerySchema>;

export const CourseIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Course ID must be a valid UUID.' }),
});

export type CourseIdParam = z.infer<typeof CourseIdParamSchema>;

// Response schemas
export const CourseSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().url().nullable(),
  category: z.string(),
  difficulty: z.string(),
  instructorName: z.string(),
  enrollmentCount: z.number().int().min(0),
  createdAt: z.string(),
});

export type CourseSummary = z.infer<typeof CourseSummarySchema>;

export const CourseCatalogResponseSchema = z.object({
  courses: z.array(CourseSummarySchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  hasMore: z.boolean(),
});

export type CourseCatalogResponse = z.infer<typeof CourseCatalogResponseSchema>;

export const CourseDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().url().nullable(),
  category: z.string(),
  difficulty: z.string(),
  instructorId: z.string().uuid(),
  instructorName: z.string(),
  enrollmentCount: z.number().int().min(0),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CourseDetail = z.infer<typeof CourseDetailSchema>;

export const CourseEnrollmentStatusSchema = z.object({
  isEnrolled: z.boolean(),
  enrolledAt: z.string().nullable(),
});

export type CourseEnrollmentStatus = z.infer<typeof CourseEnrollmentStatusSchema>;

export const CourseDetailResponseSchema = z.object({
  course: CourseDetailSchema,
  enrollment: CourseEnrollmentStatusSchema,
});

export type CourseDetailResponse = z.infer<typeof CourseDetailResponseSchema>;

// Database row schemas
export const CourseTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  thumbnail_url: z.string().nullable(),
  category: z.string(),
  difficulty: z.string(),
  instructor_id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CourseTableRow = z.infer<typeof CourseTableRowSchema>;

export const CourseWithInstructorRowSchema = CourseTableRowSchema.extend({
  instructor_name: z.string().nullable(),
  enrollment_count: z.number().int().min(0).nullable(),
});

export type CourseWithInstructorRow = z.infer<typeof CourseWithInstructorRowSchema>;

export const EnrollmentTableRowSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EnrollmentTableRow = z.infer<typeof EnrollmentTableRowSchema>;
