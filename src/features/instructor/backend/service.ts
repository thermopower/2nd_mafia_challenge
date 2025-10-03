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
} from "./schema";
import { instructorErrorCodes, mapInstructorError } from "./error";
import { failure, success, type HandlerResult } from "@/backend/http/response";

export async function getInstructorDashboard(
  client: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<InstructorDashboard, string, unknown>> {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", instructorId)
    .single();

  if (profileError || !profile) {
    return failure(404, instructorErrorCodes.DATABASE_ERROR, "Profile not found");
  }

  if (profile.role !== "instructor") {
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
      profiles!inner(user_id, full_name)
    `)
    .eq("assignments.courses.instructor_id", instructorId)
    .in("status", ["submitted", "resubmission_required"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (submissionsError) {
    const errorCode = mapInstructorError(submissionsError);
    return failure(500, errorCode, "Failed to fetch pending submissions", submissionsError);
  }

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
