import { z } from "zod";

export const InstructorCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  category: z.string(),
  difficulty: z.string(),
  enrollmentCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PendingSubmissionSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  learnerId: z.string().uuid(),
  learnerName: z.string(),
  submittedAt: z.string(),
  late: z.boolean(),
  version: z.number().int().positive(),
});

export const InstructorDashboardStatsSchema = z.object({
  totalCourses: z.number().int().min(0),
  publishedCourses: z.number().int().min(0),
  totalEnrollments: z.number().int().min(0),
  pendingSubmissions: z.number().int().min(0),
});

export const InstructorDashboardSchema = z.object({
  stats: InstructorDashboardStatsSchema,
  courses: z.array(InstructorCourseSchema),
  recentSubmissions: z.array(PendingSubmissionSchema),
});

export const InstructorCourseDetailSchema = z.object({
  id: z.string().uuid(),
  instructorId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  category: z.string(),
  difficulty: z.string(),
  enrollmentCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UpdateCourseRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  category: z.string().min(1).max(100).optional(),
  difficulty: z.string().min(1).max(50).optional(),
});

export const UpdateCourseResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  category: z.string(),
  difficulty: z.string(),
  updatedAt: z.string(),
});

export const CreateCourseRequestSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다").max(200, "제목은 200자 이하여야 합니다"),
  description: z.string().min(1, "설명은 필수입니다").max(5000, "설명은 5000자 이하여야 합니다"),
  category: z.string().min(1, "카테고리는 필수입니다").max(100),
  difficulty: z.string().min(1, "난이도는 필수입니다").max(50),
  thumbnailUrl: z.string().url("유효한 URL을 입력해주세요").nullable().optional(),
});

export const CreateCourseResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  category: z.string(),
  difficulty: z.string(),
  createdAt: z.string(),
});

export const CourseAssignmentSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueAt: z.string(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  status: z.enum(["draft", "published", "closed"]),
  submissionCount: z.number().int().min(0),
  pendingCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CourseAssignmentsResponseSchema = z.object({
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  assignments: z.array(CourseAssignmentSchema),
});

export const DeleteCourseResponseSchema = z.object({
  id: z.string().uuid(),
  deleted: z.boolean(),
});

export type InstructorCourse = z.infer<typeof InstructorCourseSchema>;
export type PendingSubmission = z.infer<typeof PendingSubmissionSchema>;
export type InstructorDashboardStats = z.infer<typeof InstructorDashboardStatsSchema>;
export type InstructorDashboard = z.infer<typeof InstructorDashboardSchema>;
export type InstructorCourseDetail = z.infer<typeof InstructorCourseDetailSchema>;
export type UpdateCourseRequest = z.infer<typeof UpdateCourseRequestSchema>;
export type UpdateCourseResponse = z.infer<typeof UpdateCourseResponseSchema>;
export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;
export type CreateCourseResponse = z.infer<typeof CreateCourseResponseSchema>;
export type CourseAssignment = z.infer<typeof CourseAssignmentSchema>;
export type CourseAssignmentsResponse = z.infer<typeof CourseAssignmentsResponseSchema>;
export type DeleteCourseResponse = z.infer<typeof DeleteCourseResponseSchema>;
