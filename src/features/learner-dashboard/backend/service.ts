import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  LearnerDashboardResponseSchema,
  type LearnerDashboardResponse,
  type EnrolledCourse,
  type UpcomingAssignment,
  type RecentFeedback,
} from '@/features/learner-dashboard/backend/schema';
import {
  learnerDashboardErrorCodes,
  type LearnerDashboardServiceError,
} from '@/features/learner-dashboard/backend/error';
import { getCourseAssignmentSummaries } from '@/features/assignments/backend/service';

const PROFILES_TABLE = 'profiles';
const ENROLLMENTS_TABLE = 'enrollments';
const COURSES_TABLE = 'courses';
const ASSIGNMENTS_TABLE = 'assignments';
const SUBMISSIONS_TABLE = 'assignment_submissions';

const fallbackThumbnail = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/400/300`;

// Helper: Check if user is learner
export const checkLearnerRole = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<boolean, LearnerDashboardServiceError, unknown>> => {
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return failure(
      500,
      learnerDashboardErrorCodes.supabaseError,
      'Failed to fetch user role',
      error,
    );
  }

  if (!data) {
    return failure(404, learnerDashboardErrorCodes.notLearner, 'User not found');
  }

  if (data.role !== 'learner') {
    return failure(
      403,
      learnerDashboardErrorCodes.notLearner,
      'Only learners can access dashboard',
    );
  }

  return success(true);
};

// Service: Get learner dashboard data
export const getLearnerDashboard = async (
  client: SupabaseClient,
  userId: string,
): Promise<
  HandlerResult<LearnerDashboardResponse, LearnerDashboardServiceError, unknown>
> => {
  // Fetch enrolled courses with assignment statistics
  const { data: enrollmentsData, error: enrollmentsError } = await client
    .from(ENROLLMENTS_TABLE)
    .select(
      `
      id,
      created_at,
      courses!inner(
        id,
        title,
        description,
        thumbnail_url,
        profiles!courses_instructor_id_fkey(full_name)
      )
    `,
    )
    .eq('learner_id', userId)
    .order('created_at', { ascending: false });

  if (enrollmentsError) {
    return failure(
      500,
      learnerDashboardErrorCodes.supabaseError,
      'Failed to fetch enrollments',
      enrollmentsError,
    );
  }

  // Get all course IDs for quick assignments fetch
  const courseIds = enrollmentsData?.map((e: any) => e.courses?.id).filter(Boolean) ?? [];

  // Fetch quick assignments for all enrolled courses
  const quickAssignmentsResult = await getCourseAssignmentSummaries(client, userId, courseIds);
  const quickAssignmentsMap = new Map();

  if (quickAssignmentsResult.ok && 'data' in quickAssignmentsResult) {
    quickAssignmentsResult.data.forEach((assignment) => {
      if (!quickAssignmentsMap.has(assignment.courseId)) {
        quickAssignmentsMap.set(assignment.courseId, []);
      }
      quickAssignmentsMap.get(assignment.courseId).push(assignment);
    });
  }

  // Process enrolled courses
  const enrolledCourses: EnrolledCourse[] = [];

  if (enrollmentsData && enrollmentsData.length > 0) {
    for (const enrollment of enrollmentsData) {
      const course = (enrollment as any).courses;
      if (!course) continue;

      // Count total assignments for this course
      const { count: totalAssignments } = await client
        .from(ASSIGNMENTS_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
        .eq('status', 'published');

      // Count completed assignments (graded submissions)
      // First, get all published assignment IDs for this course
      const { data: publishedAssignmentIds } = await client
        .from(ASSIGNMENTS_TABLE)
        .select('id')
        .eq('course_id', course.id)
        .eq('status', 'published');

      const assignmentIds = publishedAssignmentIds?.map((a) => a.id) ?? [];

      let completedAssignments = 0;
      if (assignmentIds.length > 0) {
        const { count } = await client
          .from(SUBMISSIONS_TABLE)
          .select('*', { count: 'exact', head: true })
          .eq('learner_id', userId)
          .eq('status', 'graded')
          .in('assignment_id', assignmentIds);
        completedAssignments = count ?? 0;
      }

      const total = totalAssignments ?? 0;
      const completed = completedAssignments ?? 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      enrolledCourses.push({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnail_url ?? fallbackThumbnail(course.id),
        instructorName: course.profiles?.full_name ?? 'Unknown',
        enrolledAt: enrollment.created_at,
        totalAssignments: total,
        completedAssignments: completed,
        progressPercentage: progress,
        quickAssignments: quickAssignmentsMap.get(course.id) ?? [],
      });
    }
  }

  // Fetch upcoming assignments (due in next 7 days, not completed)
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: assignmentsData, error: assignmentsError } = await client
    .from(ASSIGNMENTS_TABLE)
    .select(
      `
      id,
      title,
      due_at,
      course_id,
      courses!inner(
        id,
        title
      )
    `,
    )
    .eq('status', 'published')
    .in(
      'course_id',
      enrollmentsData?.map((e: any) => e.courses.id) ?? [],
    )
    .gte('due_at', now.toISOString())
    .lte('due_at', sevenDaysLater.toISOString())
    .order('due_at', { ascending: true })
    .limit(5);

  if (assignmentsError) {
    return failure(
      500,
      learnerDashboardErrorCodes.supabaseError,
      'Failed to fetch assignments',
      assignmentsError,
    );
  }

  // Process upcoming assignments
  const upcomingAssignments: UpcomingAssignment[] = [];

  if (assignmentsData && assignmentsData.length > 0) {
    for (const assignment of assignmentsData) {
      const course = (assignment as any).courses;

      // Check submission status
      const { data: submission } = await client
        .from(SUBMISSIONS_TABLE)
        .select('status')
        .eq('assignment_id', assignment.id)
        .eq('learner_id', userId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      let status: UpcomingAssignment['status'] = 'not_submitted';
      if (submission) {
        if (submission.status === 'graded') {
          status = 'graded';
        } else if (submission.status === 'resubmission_required') {
          status = 'resubmission_required';
        } else {
          status = 'submitted';
        }
      }

      const dueDate = new Date(assignment.due_at);
      const isOverdue = dueDate < now;

      upcomingAssignments.push({
        id: assignment.id,
        title: assignment.title,
        courseId: course.id,
        courseTitle: course.title,
        dueAt: assignment.due_at,
        status,
        isOverdue,
      });
    }
  }

  // Fetch recent feedback (last 5 graded submissions)
  const { data: feedbackData, error: feedbackError } = await client
    .from(SUBMISSIONS_TABLE)
    .select(
      `
      id,
      score,
      feedback,
      graded_at,
      assignments!inner(
        id,
        title,
        courses!inner(
          title
        )
      )
    `,
    )
    .eq('learner_id', userId)
    .eq('status', 'graded')
    .not('graded_at', 'is', null)
    .order('graded_at', { ascending: false })
    .limit(5);

  if (feedbackError) {
    return failure(
      500,
      learnerDashboardErrorCodes.supabaseError,
      'Failed to fetch feedback',
      feedbackError,
    );
  }

  // Process recent feedback
  const recentFeedback: RecentFeedback[] = [];

  if (feedbackData && feedbackData.length > 0) {
    for (const submission of feedbackData) {
      const assignment = (submission as any).assignments;
      const course = assignment?.courses;

      recentFeedback.push({
        id: submission.id,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        courseTitle: course?.title ?? 'Unknown',
        score: submission.score,
        feedback: submission.feedback,
        gradedAt: submission.graded_at!,
      });
    }
  }

  const response: LearnerDashboardResponse = {
    enrolledCourses,
    upcomingAssignments,
    recentFeedback,
  };

  const parsed = LearnerDashboardResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      learnerDashboardErrorCodes.validationError,
      'Dashboard response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
