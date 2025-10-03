import { SupabaseClient } from "@supabase/supabase-js";
import { mapKeys } from "es-toolkit";
import {
  InstructorDashboard,
  InstructorDashboardSchema,
  InstructorCourse,
  InstructorCourseSchema,
  PendingSubmission,
  PendingSubmissionSchema,
  InstructorDashboardStats,
  InstructorCourseDetail,
  InstructorCourseDetailSchema,
  UpdateCourseRequest,
  UpdateCourseResponse,
  UpdateCourseResponseSchema,
  CourseAssignment,
  CourseAssignmentSchema,
  CourseAssignmentsResponse,
  CourseAssignmentsResponseSchema,
} from "./schema";
import { instructorErrorCodes, mapInstructorError } from "./error";
import { failure, success, type HandlerResult } from "@/backend/http/response";

export async function getInstructorDashboard(
  client: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<InstructorDashboard, string, unknown>> {
  console.log('[getInstructorDashboard] Start:', { instructorId });

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", instructorId)
    .single();

  if (profileError || !profile) {
    console.error('[getInstructorDashboard] Profile error:', profileError);
    return failure(404, instructorErrorCodes.DATABASE_ERROR, "Profile not found");
  }

  if (profile.role !== "instructor") {
    console.error('[getInstructorDashboard] Not instructor:', profile.role);
    return failure(403, instructorErrorCodes.NOT_INSTRUCTOR, "User is not an instructor");
  }

  const { data: courses, error: coursesError } = await client
    .from("courses")
    .select("*")
    .eq("instructor_id", instructorId)
    .order("updated_at", { ascending: false });

  if (coursesError) {
    const errorCode = mapInstructorError(coursesError);
    return failure(500, errorCode, "Failed to fetch courses", coursesError);
  }

  const instructorCourses: InstructorCourse[] = [];
  let totalEnrollments = 0;

  for (const course of courses || []) {
    const { count: enrollmentCount } = await client
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", course.id);

    totalEnrollments += enrollmentCount || 0;

    const camelCourse = mapKeys(course, (_, key) => {
      if (typeof key === "string") {
        return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      }
      return key;
    });

    instructorCourses.push({
      ...camelCourse,
      enrollmentCount: enrollmentCount || 0,
    } as InstructorCourse);
  }

  const validatedCourses = instructorCourses.map((c) =>
    InstructorCourseSchema.safeParse(c)
  );
  const allCoursesValid = validatedCourses.every((v) => v.success);

  if (!allCoursesValid) {
    return failure(500, instructorErrorCodes.DATABASE_ERROR, "Schema validation failed for courses");
  }

  const finalCourses = validatedCourses
    .filter((v) => v.success)
    .map((v) => v.data!);

  console.log('[getInstructorDashboard] Fetching pending submissions...');

  const { data: pendingSubmissionsData, error: submissionsError } = await client
    .from("assignment_submissions")
    .select(`
      id,
      assignment_id,
      learner_id,
      created_at,
      late,
      version,
      status,
      assignments!inner(id, title, course_id, courses!inner(id, title, instructor_id)),
      profiles!assignment_submissions_learner_id_fkey!inner(user_id, full_name)
    `)
    .eq("assignments.courses.instructor_id", instructorId)
    .in("status", ["submitted", "resubmission_required"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (submissionsError) {
    console.error('[getInstructorDashboard] Submissions error:', submissionsError);
    const errorCode = mapInstructorError(submissionsError);
    return failure(500, errorCode, "Failed to fetch pending submissions", submissionsError);
  }

  console.log('[getInstructorDashboard] Pending submissions fetched:', pendingSubmissionsData?.length);

  const pendingSubmissions: PendingSubmission[] = (pendingSubmissionsData || []).map((item: any) => ({
    id: item.id,
    assignmentId: item.assignment_id,
    assignmentTitle: item.assignments?.title || "",
    courseId: item.assignments?.courses?.id || "",
    courseTitle: item.assignments?.courses?.title || "",
    learnerId: item.learner_id,
    learnerName: item.profiles?.full_name || "Unknown",
    submittedAt: item.created_at,
    late: item.late,
    version: item.version,
  }));

  const validatedSubmissions = pendingSubmissions.map((s) =>
    PendingSubmissionSchema.safeParse(s)
  );
  const allSubmissionsValid = validatedSubmissions.every((v) => v.success);

  if (!allSubmissionsValid) {
    return failure(500, instructorErrorCodes.DATABASE_ERROR, "Schema validation failed for submissions");
  }

  const finalSubmissions = validatedSubmissions
    .filter((v) => v.success)
    .map((v) => v.data!);

  const { count: totalPendingCount } = await client
    .from("assignment_submissions")
    .select("*, assignments!inner(course_id, courses!inner(instructor_id))", { count: "exact", head: true })
    .eq("assignments.courses.instructor_id", instructorId)
    .in("status", ["submitted", "resubmission_required"]);

  const stats: InstructorDashboardStats = {
    totalCourses: finalCourses.length,
    publishedCourses: finalCourses.filter((c) => c.status === "published").length,
    totalEnrollments,
    pendingSubmissions: totalPendingCount || 0,
  };

  const dashboard: InstructorDashboard = {
    stats,
    courses: finalCourses,
    recentSubmissions: finalSubmissions,
  };

  const parsed = InstructorDashboardSchema.safeParse(dashboard);
  if (!parsed.success) {
    return failure(500, instructorErrorCodes.DATABASE_ERROR, "Schema validation failed", parsed.error);
  }

  return success(parsed.data);
}

export async function getInstructorCourseDetail(
  client: SupabaseClient,
  courseId: string,
  instructorId: string
): Promise<HandlerResult<InstructorCourseDetail, string, unknown>> {
  const { data: course, error: courseError } = await client
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return failure(404, instructorErrorCodes.COURSE_NOT_FOUND, "Course not found");
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, instructorErrorCodes.NOT_COURSE_OWNER, "You do not own this course");
  }

  const { count: enrollmentCount } = await client
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  const camelCourse = mapKeys(course, (_, key) => {
    if (typeof key === "string") {
      return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    return key;
  });

  const detail: InstructorCourseDetail = {
    ...camelCourse,
    enrollmentCount: enrollmentCount || 0,
  } as InstructorCourseDetail;

  const parsed = InstructorCourseDetailSchema.safeParse(detail);
  if (!parsed.success) {
    return failure(500, instructorErrorCodes.DATABASE_ERROR, "Schema validation failed", parsed.error);
  }

  return success(parsed.data);
}

export async function updateCourse(
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  updates: UpdateCourseRequest
): Promise<HandlerResult<UpdateCourseResponse, string, unknown>> {
  const { data: course, error: courseError } = await client
    .from("courses")
    .select("instructor_id")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return failure(404, instructorErrorCodes.COURSE_NOT_FOUND, "Course not found");
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, instructorErrorCodes.NOT_COURSE_OWNER, "You do not own this course");
  }

  const snakeCaseUpdates = mapKeys(updates, (_, key) => {
    if (typeof key === "string") {
      return key.replace(/([A-Z])/g, "_$1").toLowerCase();
    }
    return key;
  });

  const { data: updated, error: updateError } = await client
    .from("courses")
    .update(snakeCaseUpdates)
    .eq("id", courseId)
    .select("id, title, description, status, category, difficulty, updated_at")
    .single();

  if (updateError || !updated) {
    const errorCode = mapInstructorError(updateError);
    return failure(500, errorCode, "Failed to update course", updateError);
  }

  const camelUpdated = mapKeys(updated, (_, key) => {
    if (typeof key === "string") {
      return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    return key;
  });

  const parsed = UpdateCourseResponseSchema.safeParse(camelUpdated);
  if (!parsed.success) {
    return failure(500, instructorErrorCodes.DATABASE_ERROR, "Schema validation failed", parsed.error);
  }

  return success(parsed.data);
}

export async function getCourseAssignments(
  client: SupabaseClient,
  courseId: string,
  instructorId: string
): Promise<HandlerResult<CourseAssignmentsResponse, string, unknown>> {
  const { data: course, error: courseError } = await client
    .from("courses")
    .select("id, title, instructor_id")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return failure(404, instructorErrorCodes.COURSE_NOT_FOUND, "Course not found");
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, instructorErrorCodes.NOT_COURSE_OWNER, "You do not own this course");
  }

  const { data: assignments, error: assignmentsError } = await client
    .from("assignments")
    .select("*")
    .eq("course_id", courseId)
    .order("due_at", { ascending: true });

  if (assignmentsError) {
    const errorCode = mapInstructorError(assignmentsError);
    return failure(500, errorCode, "Failed to fetch assignments", assignmentsError);
  }

  const assignmentsWithCounts: CourseAssignment[] = [];

  for (const assignment of assignments || []) {
    const { count: submissionCount } = await client
      .from("assignment_submissions")
      .select("*", { count: "exact", head: true })
      .eq("assignment_id", assignment.id);

    const { count: pendingCount } = await client
      .from("assignment_submissions")
      .select("*", { count: "exact", head: true })
      .eq("assignment_id", assignment.id)
      .in("status", ["submitted", "resubmission_required"]);

    const camelAssignment = mapKeys(assignment, (_, key) => {
      if (typeof key === "string") {
        return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      }
      return key;
    });

    assignmentsWithCounts.push({
      ...camelAssignment,
      submissionCount: submissionCount || 0,
      pendingCount: pendingCount || 0,
    } as CourseAssignment);
  }

  const validatedAssignments = assignmentsWithCounts.map((a) =>
    CourseAssignmentSchema.safeParse(a)
  );
  const allValid = validatedAssignments.every((v) => v.success);

  if (!allValid) {
    return failure(500, instructorErrorCodes.DATABASE_ERROR, "Schema validation failed for assignments");
  }

  const finalAssignments = validatedAssignments
    .filter((v) => v.success)
    .map((v) => v.data!);

  const response: CourseAssignmentsResponse = {
    courseId: course.id,
    courseTitle: course.title,
    assignments: finalAssignments,
  };

  const parsedResponse = CourseAssignmentsResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    return failure(500, instructorErrorCodes.DATABASE_ERROR, "Schema validation failed", parsedResponse.error);
  }

  return success(parsedResponse.data);
}
