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
} as const;

export type AssignmentDetailErrorCode =
  (typeof assignmentDetailErrorCodes)[keyof typeof assignmentDetailErrorCodes];

export function mapAssignmentError(
  error: PostgrestError | Error
): AssignmentDetailErrorCode {
  if ("code" in error) {
    return match(error.code)
      .with("PGRST116", () => assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND)
      .otherwise(() => assignmentDetailErrorCodes.DATABASE_ERROR);
  }
  return assignmentDetailErrorCodes.DATABASE_ERROR;
}
