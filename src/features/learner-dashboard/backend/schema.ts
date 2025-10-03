import { z } from 'zod';
import { CourseAssignmentSummarySchema } from '@/features/assignments/backend/schema';

// Enrolled course schema
export const EnrolledCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().nullable(),
  instructorName: z.string(),
  enrolledAt: z.string(),
  totalAssignments: z.number().int().nonnegative(),
  completedAssignments: z.number().int().nonnegative(),
  progressPercentage: z.number().min(0).max(100),
  quickAssignments: z.array(CourseAssignmentSummarySchema).optional(),
});

export type EnrolledCourse = z.infer<typeof EnrolledCourseSchema>;

// Upcoming assignment schema
export const UpcomingAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  dueAt: z.string(),
  status: z.enum(['not_submitted', 'submitted', 'graded', 'resubmission_required']),
  isOverdue: z.boolean(),
});

export type UpcomingAssignment = z.infer<typeof UpcomingAssignmentSchema>;

// Recent feedback schema
export const RecentFeedbackSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  courseTitle: z.string(),
  score: z.number().int().min(0).max(100).nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string(),
});

export type RecentFeedback = z.infer<typeof RecentFeedbackSchema>;

// Learner dashboard response schema
export const LearnerDashboardResponseSchema = z.object({
  enrolledCourses: z.array(EnrolledCourseSchema),
  upcomingAssignments: z.array(UpcomingAssignmentSchema),
  recentFeedback: z.array(RecentFeedbackSchema),
});

export type LearnerDashboardResponse = z.infer<typeof LearnerDashboardResponseSchema>;
