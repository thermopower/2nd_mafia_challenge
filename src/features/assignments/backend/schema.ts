import { z } from "zod";

export const AssignmentDetailSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueAt: z.string(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  status: z.enum(["draft", "published", "closed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CourseAssignmentSummarySchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  dueAt: z.string(),
  status: z.enum(["draft", "published", "closed"]),
  submissionStatus: z
    .enum(["not_submitted", "submitted", "graded", "resubmission_required"])
    .optional(),
  late: z.boolean().optional(),
  score: z.number().nullable().optional(),
});

export const SubmitAssignmentRequestSchema = z.object({
  submissionText: z.string().min(1, "제출 내용을 입력해주세요"),
  submissionLink: z.string().url("올바른 URL 형식을 입력해주세요").optional(),
});

export const SubmitAssignmentResponseSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["submitted"]),
  late: z.boolean(),
  version: z.number().int().positive(),
});

export const AssignmentSubmissionDetailSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  learnerId: z.string().uuid(),
  version: z.number().int().positive(),
  answerText: z.string(),
  answerLink: z.string().nullable(),
  status: z.enum(["submitted", "graded", "resubmission_required"]),
  late: z.boolean(),
  score: z.number().int().min(0).max(100).nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(),
  gradedBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GradeAssignmentRequestSchema = z
  .object({
    score: z.number().int().min(0).max(100).optional(),
    feedback: z.string().min(5, "피드백은 최소 5자 이상 작성해야 합니다"),
    requestResubmission: z.boolean(),
    expectedUpdatedAt: z.string(),
  })
  .refine(
    (data) => {
      if (!data.requestResubmission && data.score === undefined) {
        return false;
      }
      return true;
    },
    {
      message: "재제출 요청이 아닌 경우 점수를 입력해야 합니다",
    }
  );

export const GradeAssignmentResponseSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["graded", "resubmission_required"]),
  score: z.number().int().min(0).max(100).nullable(),
  feedback: z.string(),
  gradedAt: z.string(),
  gradedBy: z.string().uuid(),
  updatedAt: z.string(),
});

export type AssignmentDetail = z.infer<typeof AssignmentDetailSchema>;
export type CourseAssignmentSummary = z.infer<
  typeof CourseAssignmentSummarySchema
>;
export type SubmitAssignmentRequest = z.infer<typeof SubmitAssignmentRequestSchema>;
export type SubmitAssignmentResponse = z.infer<typeof SubmitAssignmentResponseSchema>;
export type AssignmentSubmissionDetail = z.infer<typeof AssignmentSubmissionDetailSchema>;
export type GradeAssignmentRequest = z.infer<typeof GradeAssignmentRequestSchema>;
export type GradeAssignmentResponse = z.infer<typeof GradeAssignmentResponseSchema>;
