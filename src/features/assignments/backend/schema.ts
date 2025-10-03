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

export type AssignmentDetail = z.infer<typeof AssignmentDetailSchema>;
export type CourseAssignmentSummary = z.infer<
  typeof CourseAssignmentSummarySchema
>;
export type SubmitAssignmentRequest = z.infer<typeof SubmitAssignmentRequestSchema>;
export type SubmitAssignmentResponse = z.infer<typeof SubmitAssignmentResponseSchema>;
