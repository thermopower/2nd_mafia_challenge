import { match } from "ts-pattern";
import { PostgrestError } from "@supabase/supabase-js";

export const assignmentDetailErrorCodes = {
  ASSIGNMENT_NOT_FOUND: "ASSIGNMENT_NOT_FOUND",
  ENROLLMENT_NOT_FOUND: "ENROLLMENT_NOT_FOUND",
  ASSIGNMENT_NOT_PUBLISHED: "ASSIGNMENT_NOT_PUBLISHED",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  DATABASE_ERROR: "DATABASE_ERROR",
  ASSIGNMENT_CLOSED: "ASSIGNMENT_CLOSED",
  LATE_SUBMISSION_NOT_ALLOWED: "LATE_SUBMISSION_NOT_ALLOWED",
  RESUBMISSION_NOT_ALLOWED: "RESUBMISSION_NOT_ALLOWED",
  INVALID_SUBMISSION_DATA: "INVALID_SUBMISSION_DATA",
  INSTRUCTOR_NOT_OWNER: "INSTRUCTOR_NOT_OWNER",
  SUBMISSION_NOT_FOUND: "SUBMISSION_NOT_FOUND",
  SUBMISSION_STATUS_LOCKED: "SUBMISSION_STATUS_LOCKED",
  CONFLICT_ON_UPDATE: "CONFLICT_ON_UPDATE",
  INVALID_SCORE_RANGE: "INVALID_SCORE_RANGE",
  FEEDBACK_TOO_SHORT: "FEEDBACK_TOO_SHORT",
  ASSIGNMENT_ALREADY_DELETED: "ASSIGNMENT_ALREADY_DELETED",
  ASSIGNMENT_STATUS_LOCKED: "ASSIGNMENT_STATUS_LOCKED",
  ASSIGNMENT_DELETE_FORBIDDEN: "ASSIGNMENT_DELETE_FORBIDDEN",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  COURSE_NOT_FOUND: "COURSE_NOT_FOUND",
} as const;

export type AssignmentDetailErrorCode =
  (typeof assignmentDetailErrorCodes)[keyof typeof assignmentDetailErrorCodes];

export function mapAssignmentError(
  error: PostgrestError | Error | { code: string }
): AssignmentDetailErrorCode {
  if ("code" in error) {
    return match(error.code)
      .with("PGRST116", () => assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND)
      .with("23503", () => assignmentDetailErrorCodes.COURSE_NOT_FOUND)
      .with("23505", () => assignmentDetailErrorCodes.CONFLICT_ON_UPDATE)
      .with("ASSIGNMENT_ALREADY_DELETED", () => assignmentDetailErrorCodes.ASSIGNMENT_ALREADY_DELETED)
      .with("ASSIGNMENT_STATUS_LOCKED", () => assignmentDetailErrorCodes.ASSIGNMENT_STATUS_LOCKED)
      .with("ASSIGNMENT_DELETE_FORBIDDEN", () => assignmentDetailErrorCodes.ASSIGNMENT_DELETE_FORBIDDEN)
      .with("INVALID_STATUS_TRANSITION", () => assignmentDetailErrorCodes.INVALID_STATUS_TRANSITION)
      .with("INSTRUCTOR_NOT_OWNER", () => assignmentDetailErrorCodes.INSTRUCTOR_NOT_OWNER)
      .otherwise(() => assignmentDetailErrorCodes.DATABASE_ERROR);
  }
  return assignmentDetailErrorCodes.DATABASE_ERROR;
}
