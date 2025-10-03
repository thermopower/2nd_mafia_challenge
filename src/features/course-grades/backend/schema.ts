import { z } from "zod";
import { GRADE_CONSTANTS } from "../constants/grades";

// 과제별 성적 정보
export const AssignmentGradeSchema = z.object({
  assignmentId: z.string().uuid(),
  title: z.string(),
  weight: z.number().min(0).max(GRADE_CONSTANTS.MAX_WEIGHT),
  score: z.number().min(0).max(GRADE_CONSTANTS.MAX_SCORE).nullable(),
  status: z.enum(["submitted", "graded", "resubmission_required", "not_submitted"]),
  late: z.boolean(),
  feedback: z.string().nullable(),
  submittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
});

// 코스 성적 요약
export const CourseGradeSummarySchema = z.object({
  totalScore: z.number().min(0).max(GRADE_CONSTANTS.MAX_SCORE),
  totalWeight: z.number().min(0).max(GRADE_CONSTANTS.MAX_WEIGHT),
  gradedCount: z.number().int().min(0),
  totalAssignments: z.number().int().min(0),
  isPartialScore: z.boolean(),
});

// 코스 성적 응답
export const CourseGradesResponseSchema = z.object({
  summary: CourseGradeSummarySchema,
  assignments: z.array(AssignmentGradeSchema),
});

export type AssignmentGrade = z.infer<typeof AssignmentGradeSchema>;
export type CourseGradeSummary = z.infer<typeof CourseGradeSummarySchema>;
export type CourseGradesResponse = z.infer<typeof CourseGradesResponseSchema>;
