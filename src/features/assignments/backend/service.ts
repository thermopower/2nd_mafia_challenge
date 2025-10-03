import { SupabaseClient } from "@supabase/supabase-js";
import { mapKeys } from "es-toolkit";
import {
  AssignmentDetail,
  AssignmentDetailSchema,
  CourseAssignmentSummary,
  CourseAssignmentSummarySchema,
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
  SubmitAssignmentResponseSchema,
  AssignmentSubmissionDetail,
  AssignmentSubmissionDetailSchema,
  GradeAssignmentRequest,
  GradeAssignmentResponse,
  GradeAssignmentResponseSchema,
} from "./schema";
import {
  assignmentDetailErrorCodes,
  mapAssignmentError,
} from "./error";
import { failure, success, type HandlerResult } from "@/backend/http/response";

export async function getAssignmentDetail(
  client: SupabaseClient,
  assignmentId: string,
  learnerId: string
): Promise<HandlerResult<AssignmentDetail, string, unknown>> {
  const enrollmentCheck = await client
    .from("enrollments")
    .select("id, course_id")
    .eq("learner_id", learnerId)
    .single();

  if (enrollmentCheck.error) {
    return failure(403, assignmentDetailErrorCodes.ENROLLMENT_NOT_FOUND, "Enrollment not found");
  }

  const { data, error } = await client
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .eq("course_id", enrollmentCheck.data.course_id)
    .single();

  if (error) {
    const errorCode = mapAssignmentError(error);
    return failure(500, errorCode, "Database error", error);
  }

  if (!data) {
    return failure(404, assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND, "Assignment not found");
  }

  if (data.status !== "published") {
    return failure(404, assignmentDetailErrorCodes.ASSIGNMENT_NOT_PUBLISHED, "Assignment not published");
  }

  const camelData = mapKeys(data, (_, key) => {
    if (typeof key === 'string') {
      return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    return key;
  });

  const parsed = AssignmentDetailSchema.safeParse(camelData);
  if (!parsed.success) {
    return failure(500, assignmentDetailErrorCodes.DATABASE_ERROR, "Schema validation failed", parsed.error);
  }

  return success(parsed.data);
}

export async function getCourseAssignmentSummaries(
  client: SupabaseClient,
  learnerId: string,
  courseIds: string[]
): Promise<HandlerResult<CourseAssignmentSummary[], string, unknown>> {
  if (courseIds.length === 0) {
    return success([]);
  }

  const { data, error } = await client
    .from("assignments")
    .select("id, course_id, title, due_at, status")
    .in("course_id", courseIds)
    .eq("status", "published")
    .order("due_at", { ascending: true });

  if (error) {
    const errorCode = mapAssignmentError(error);
    return failure(500, errorCode, "Failed to fetch assignment summaries", error);
  }

  const summaries: CourseAssignmentSummary[] = [];

  for (const item of data || []) {
    const { data: submissions } = await client
      .from("assignment_submissions")
      .select("status, late, score")
      .eq("assignment_id", item.id)
      .eq("learner_id", learnerId)
      .order("version", { ascending: false })
      .limit(1);

    const latestSubmission = submissions?.[0];

    summaries.push({
      id: item.id,
      courseId: item.course_id,
      title: item.title,
      dueAt: item.due_at,
      status: item.status as "draft" | "published" | "closed",
      submissionStatus: latestSubmission?.status
        ? (latestSubmission.status as "submitted" | "graded" | "resubmission_required")
        : "not_submitted",
      late: latestSubmission?.late,
      score: latestSubmission?.score,
    });
  }

  const validated = summaries.map((s) =>
    CourseAssignmentSummarySchema.safeParse(s)
  );
  const allValid = validated.every((v) => v.success);

  if (!allValid) {
    return failure(500, assignmentDetailErrorCodes.DATABASE_ERROR, "Schema validation failed for summaries");
  }

  return success(
    validated.map((v) => (v.success ? v.data : ({} as CourseAssignmentSummary)))
  );
}

export async function submitAssignment(
  client: SupabaseClient,
  assignmentId: string,
  learnerId: string,
  request: SubmitAssignmentRequest
): Promise<HandlerResult<SubmitAssignmentResponse, string, unknown>> {
  const { data: assignment, error: assignmentError } = await client
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(404, assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND, "Assignment not found");
  }

  const enrollmentCheck = await client
    .from("enrollments")
    .select("id")
    .eq("learner_id", learnerId)
    .eq("course_id", assignment.course_id)
    .single();

  if (enrollmentCheck.error) {
    return failure(403, assignmentDetailErrorCodes.ENROLLMENT_NOT_FOUND, "Enrollment not found");
  }

  if (assignment.status === "closed") {
    return failure(400, assignmentDetailErrorCodes.ASSIGNMENT_CLOSED, "Assignment is closed");
  }

  if (assignment.status !== "published") {
    return failure(400, assignmentDetailErrorCodes.ASSIGNMENT_NOT_PUBLISHED, "Assignment not published");
  }

  const dueDate = new Date(assignment.due_at);
  const now = new Date();
  const isLate = now > dueDate;

  if (isLate && !assignment.allow_late) {
    return failure(400, assignmentDetailErrorCodes.LATE_SUBMISSION_NOT_ALLOWED, "Late submission not allowed");
  }

  const { data: existingSubmissions } = await client
    .from("assignment_submissions")
    .select("version")
    .eq("assignment_id", assignmentId)
    .eq("learner_id", learnerId)
    .order("version", { ascending: false });

  const existingVersion = existingSubmissions?.[0]?.version || 0;

  if (existingVersion > 0 && !assignment.allow_resubmission) {
    return failure(400, assignmentDetailErrorCodes.RESUBMISSION_NOT_ALLOWED, "Resubmission not allowed");
  }

  const newVersion = existingVersion + 1;

  const { data: submission, error: submissionError } = await client
    .from("assignment_submissions")
    .insert({
      assignment_id: assignmentId,
      learner_id: learnerId,
      version: newVersion,
      answer_text: request.submissionText,
      answer_link: request.submissionLink || null,
      status: "submitted",
      late: isLate,
    })
    .select("id, status, late, version")
    .single();

  if (submissionError || !submission) {
    const errorCode = mapAssignmentError(submissionError);
    return failure(500, errorCode, "Failed to submit assignment", submissionError);
  }

  const camelData = mapKeys(submission, (_, key) => {
    if (typeof key === 'string') {
      return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    return key;
  });

  const response = {
    submissionId: camelData.id,
    status: camelData.status,
    late: camelData.late,
    version: camelData.version,
  };

  const parsed = SubmitAssignmentResponseSchema.safeParse(response);
  if (!parsed.success) {
    return failure(500, assignmentDetailErrorCodes.DATABASE_ERROR, "Schema validation failed", parsed.error);
  }

  return success(parsed.data);
}

export async function getSubmissionForInstructor(
  client: SupabaseClient,
  assignmentId: string,
  submissionId: string,
  instructorId: string
): Promise<HandlerResult<AssignmentSubmissionDetail, string, unknown>> {
  const { data: assignment, error: assignmentError } = await client
    .from("assignments")
    .select("course_id")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return failure(404, assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND, "Assignment not found");
  }

  const { data: course, error: courseError } = await client
    .from("courses")
    .select("instructor_id")
    .eq("id", assignment.course_id)
    .single();

  if (courseError || !course) {
    return failure(404, assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND, "Course not found");
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, assignmentDetailErrorCodes.INSTRUCTOR_NOT_OWNER, "Instructor does not own this course");
  }

  const { data: submission, error: submissionError } = await client
    .from("assignment_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("assignment_id", assignmentId)
    .single();

  if (submissionError) {
    console.error('Submission query error:', submissionError);
    return failure(404, assignmentDetailErrorCodes.SUBMISSION_NOT_FOUND, "Submission not found", submissionError);
  }

  if (!submission) {
    return failure(404, assignmentDetailErrorCodes.SUBMISSION_NOT_FOUND, "Submission not found");
  }

  const camelData = mapKeys(submission, (_, key) => {
    if (typeof key === 'string') {
      return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    return key;
  });

  // Ensure gradedBy exists (backwards compatibility)
  if (!('gradedBy' in camelData)) {
    camelData.gradedBy = null;
  }

  console.log('Submission data from DB:', submission);
  console.log('Camel case transformed:', camelData);

  const parsed = AssignmentSubmissionDetailSchema.safeParse(camelData);
  if (!parsed.success) {
    console.error('Schema validation failed:', JSON.stringify(parsed.error, null, 2));
    return failure(500, assignmentDetailErrorCodes.DATABASE_ERROR, "Schema validation failed", parsed.error);
  }

  return success(parsed.data);
}

export async function gradeAssignment(
  client: SupabaseClient,
  assignmentId: string,
  submissionId: string,
  instructorId: string,
  payload: GradeAssignmentRequest
): Promise<HandlerResult<GradeAssignmentResponse, string, unknown>> {
  console.log('[gradeAssignment] Start:', { assignmentId, submissionId, instructorId, payload });

  const { data: assignment, error: assignmentError } = await client
    .from("assignments")
    .select("course_id")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    console.error('[gradeAssignment] Assignment not found:', assignmentError);
    return failure(404, assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND, "Assignment not found");
  }

  const { data: course, error: courseError } = await client
    .from("courses")
    .select("instructor_id")
    .eq("id", assignment.course_id)
    .single();

  if (courseError || !course) {
    return failure(404, assignmentDetailErrorCodes.ASSIGNMENT_NOT_FOUND, "Course not found");
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, assignmentDetailErrorCodes.INSTRUCTOR_NOT_OWNER, "Instructor does not own this course");
  }

  const { data: currentSubmission, error: fetchError } = await client
    .from("assignment_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("assignment_id", assignmentId)
    .single();

  if (fetchError || !currentSubmission) {
    console.error('[gradeAssignment] Submission not found:', fetchError);
    return failure(404, assignmentDetailErrorCodes.SUBMISSION_NOT_FOUND, "Submission not found");
  }

  console.log('[gradeAssignment] Current submission:', currentSubmission);

  if (currentSubmission.status !== "submitted" && currentSubmission.status !== "resubmission_required") {
    console.error('[gradeAssignment] Invalid status:', currentSubmission.status);
    return failure(400, assignmentDetailErrorCodes.SUBMISSION_STATUS_LOCKED, "Submission status does not allow grading");
  }

  // Optimistic concurrency control is disabled for now
  // The timestamp comparison was too strict and causing false positives
  // TODO: Implement proper versioning or use database-level locking if needed

  const now = new Date().toISOString();
  const updateData: {
    status: "graded" | "resubmission_required";
    score: number | null;
    feedback: string;
    graded_at: string;
    graded_by: string;
  } = {
    status: payload.requestResubmission ? "resubmission_required" : "graded",
    score: payload.requestResubmission ? null : payload.score!,
    feedback: payload.feedback,
    graded_at: now,
    graded_by: instructorId,
  };

  console.log('[gradeAssignment] Update data:', updateData);

  const { data: updatedSubmission, error: updateError } = await client
    .from("assignment_submissions")
    .update(updateData)
    .eq("id", submissionId)
    .select("id, status, score, feedback, graded_at, graded_by, updated_at")
    .single();

  if (updateError || !updatedSubmission) {
    console.error('[gradeAssignment] Update failed:', updateError);
    const errorCode = mapAssignmentError(updateError);
    return failure(500, errorCode, "Failed to update submission", updateError);
  }

  console.log('[gradeAssignment] Updated submission:', updatedSubmission);

  const camelData = mapKeys(updatedSubmission, (_, key) => {
    if (typeof key === 'string') {
      return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    return key;
  });

  const response = {
    submissionId: camelData.id,
    status: camelData.status,
    score: camelData.score,
    feedback: camelData.feedback,
    gradedAt: camelData.gradedAt,
    gradedBy: camelData.gradedBy,
    updatedAt: camelData.updatedAt,
  };

  const parsed = GradeAssignmentResponseSchema.safeParse(response);
  if (!parsed.success) {
    return failure(500, assignmentDetailErrorCodes.DATABASE_ERROR, "Schema validation failed", parsed.error);
  }

  return success(parsed.data);
}
