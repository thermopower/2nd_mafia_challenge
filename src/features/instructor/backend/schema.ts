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

export type InstructorCourse = z.infer<typeof InstructorCourseSchema>;
export type PendingSubmission = z.infer<typeof PendingSubmissionSchema>;
export type InstructorDashboardStats = z.infer<typeof InstructorDashboardStatsSchema>;
export type InstructorDashboard = z.infer<typeof InstructorDashboardSchema>;
