import { match } from "ts-pattern";
import { PostgrestError } from "@supabase/supabase-js";

export const instructorErrorCodes = {
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
  NOT_INSTRUCTOR: "NOT_INSTRUCTOR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INVALID_REQUEST: "INVALID_REQUEST",
  COURSE_NOT_FOUND: "COURSE_NOT_FOUND",
  NOT_COURSE_OWNER: "NOT_COURSE_OWNER",
  COURSE_UPDATE_FAILED: "COURSE_UPDATE_FAILED",
} as const;

export type InstructorErrorCode =
  (typeof instructorErrorCodes)[keyof typeof instructorErrorCodes];

export function mapInstructorError(
  error: PostgrestError | Error
): InstructorErrorCode {
  if ("code" in error) {
    return match(error.code)
      .with("PGRST116", () => instructorErrorCodes.DATABASE_ERROR)
      .otherwise(() => instructorErrorCodes.DATABASE_ERROR);
  }
  return instructorErrorCodes.DATABASE_ERROR;
}
