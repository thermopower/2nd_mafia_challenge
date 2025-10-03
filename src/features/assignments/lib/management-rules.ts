import { match } from "ts-pattern";
import { AssignmentStatus } from "../backend/schema";

export type DeletionMode = "hard" | "soft";

export interface SubmissionStats {
  totalCount: number;
  gradedCount: number;
}

export function canEditField(
  status: AssignmentStatus,
  field: string
): boolean {
  return match(status)
    .with("draft", () => true)
    .with("published", () =>
      ["dueAt", "allowLate", "gradingRubric"].includes(field)
    )
    .with("closed", () => false)
    .exhaustive();
}

export function determineDeletionMode(
  status: AssignmentStatus,
  submissionStats: SubmissionStats
): DeletionMode {
  if (status === "draft" && submissionStats.totalCount === 0) {
    return "hard";
  }
  return "soft";
}

export function calculateAutoCloseAt(
  dueAt: Date,
  allowLate: boolean
): Date | null {
  if (!allowLate) {
    return dueAt;
  }
  return null;
}

export function isStatusTransitionAllowed(
  currentStatus: AssignmentStatus,
  targetStatus: AssignmentStatus
): boolean {
  return match([currentStatus, targetStatus] as const)
    .with(["draft", "published"], () => true)
    .with(["published", "closed"], () => true)
    .with(["draft", "closed"], () => false)
    .with(["closed", "published"], () => false)
    .with(["published", "draft"], () => false)
    .otherwise(() => currentStatus === targetStatus);
}

export function shouldSoftDelete(
  status: AssignmentStatus,
  submissionStats: SubmissionStats
): boolean {
  return determineDeletionMode(status, submissionStats) === "soft";
}
