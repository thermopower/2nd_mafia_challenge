import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  CourseCatalogResponseSchema,
  CourseDetailResponseSchema,
  CourseWithInstructorRowSchema,
  CourseTableRowSchema,
  CourseSortBy,
  type CourseCatalogQuery,
  type CourseCatalogResponse,
  type CourseDetailResponse,
  type CourseWithInstructorRow,
  type CourseTableRow,
} from '@/features/course-catalog/backend/schema';
import {
  courseCatalogErrorCodes,
  type CourseCatalogServiceError,
} from '@/features/course-catalog/backend/error';

const COURSES_TABLE = 'courses';
const ENROLLMENTS_TABLE = 'enrollments';
const PROFILES_TABLE = 'profiles';

const fallbackThumbnail = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/400/300`;

// Helper: Check if user is learner
export const checkLearnerRole = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<boolean, CourseCatalogServiceError, unknown>> => {
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to fetch user role',
      error,
    );
  }

  if (!data) {
    return failure(404, courseCatalogErrorCodes.notLearner, 'User not found');
  }

  if (data.role !== 'learner') {
    return failure(
      403,
      courseCatalogErrorCodes.notLearner,
      'Only learners can access course catalog',
    );
  }

  return success(true);
};

// Service: Get course catalog with filters
export const getCourseCatalog = async (
  client: SupabaseClient,
  query: CourseCatalogQuery,
): Promise<
  HandlerResult<CourseCatalogResponse, CourseCatalogServiceError, unknown>
> => {
  const { search, category, difficulty, sortBy, page, limit } = query;
  const offset = (page - 1) * limit;

  let queryBuilder = client
    .from(COURSES_TABLE)
    .select(
      `
      id,
      title,
      description,
      thumbnail_url,
      category,
      difficulty,
      instructor_id,
      status,
      created_at,
      updated_at,
      profiles!courses_instructor_id_fkey(full_name),
      enrollments(count)
    `,
      { count: 'exact' },
    )
    .eq('status', 'published');

  // Apply search filter
  if (search && search.trim()) {
    queryBuilder = queryBuilder.ilike('title', `%${search.trim()}%`);
  }

  // Apply category filter
  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  // Apply difficulty filter
  if (difficulty) {
    queryBuilder = queryBuilder.eq('difficulty', difficulty);
  }

  // Apply sorting
  if (sortBy === CourseSortBy.Latest) {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
  } else if (sortBy === CourseSortBy.Popular) {
    // For popularity, we'd need enrollment count - for now, use created_at
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
  }

  // Apply pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to fetch courses',
      error,
    );
  }

  if (!data) {
    return success({
      courses: [],
      total: 0,
      page,
      limit,
      hasMore: false,
    });
  }

  const total = count ?? 0;

  // Map database rows to response format
  const courses = data.map((row: any) => {
    const instructorName =
      (row.profiles as any)?.full_name ?? 'Unknown Instructor';
    const enrollmentCount =
      Array.isArray(row.enrollments) && row.enrollments.length > 0
        ? (row.enrollments[0] as any)?.count ?? 0
        : 0;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnailUrl: row.thumbnail_url ?? fallbackThumbnail(row.id),
      category: row.category,
      difficulty: row.difficulty,
      instructorName,
      enrollmentCount,
      createdAt: row.created_at,
    };
  });

  const response: CourseCatalogResponse = {
    courses,
    total,
    page,
    limit,
    hasMore: offset + limit < total,
  };

  const parsed = CourseCatalogResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      courseCatalogErrorCodes.validationError,
      'Course catalog response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// Service: Get course detail with enrollment status
export const getCourseDetail = async (
  client: SupabaseClient,
  courseId: string,
  userId?: string,
): Promise<
  HandlerResult<CourseDetailResponse, CourseCatalogServiceError, unknown>
> => {
  // Fetch course details with instructor info
  const { data: courseData, error: courseError } = await client
    .from(COURSES_TABLE)
    .select(
      `
      id,
      title,
      description,
      thumbnail_url,
      category,
      difficulty,
      instructor_id,
      status,
      created_at,
      updated_at,
      profiles!courses_instructor_id_fkey(full_name),
      enrollments(count)
    `,
    )
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to fetch course detail',
      courseError,
    );
  }

  if (!courseData) {
    return failure(
      404,
      courseCatalogErrorCodes.courseNotFound,
      'Course not found',
    );
  }

  // Check enrollment status only if user is logged in
  let enrollmentData = null;
  if (userId) {
    const { data, error: enrollmentError } = await client
      .from(ENROLLMENTS_TABLE)
      .select('id, created_at')
      .eq('course_id', courseId)
      .eq('learner_id', userId)
      .maybeSingle();

    if (enrollmentError) {
      return failure(
        500,
        courseCatalogErrorCodes.supabaseError,
        'Failed to fetch enrollment status',
        enrollmentError,
      );
    }

    enrollmentData = data;
  }

  const instructorName =
    (courseData.profiles as any)?.full_name ?? 'Unknown Instructor';
  const enrollmentCount =
    Array.isArray(courseData.enrollments) && courseData.enrollments.length > 0
      ? (courseData.enrollments[0] as any)?.count ?? 0
      : 0;

  const response: CourseDetailResponse = {
    course: {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      thumbnailUrl: courseData.thumbnail_url ?? fallbackThumbnail(courseData.id),
      category: courseData.category,
      difficulty: courseData.difficulty,
      instructorId: courseData.instructor_id,
      instructorName,
      enrollmentCount,
      status: courseData.status as 'draft' | 'published' | 'archived',
      createdAt: courseData.created_at,
      updatedAt: courseData.updated_at,
    },
    enrollment: {
      isEnrolled: !!enrollmentData,
      enrolledAt: enrollmentData?.created_at ?? null,
    },
  };

  const parsed = CourseDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      courseCatalogErrorCodes.validationError,
      'Course detail response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// Service: Enroll in course
export const enrollInCourse = async (
  client: SupabaseClient,
  courseId: string,
  userId: string,
): Promise<HandlerResult<{ success: boolean }, CourseCatalogServiceError, unknown>> => {
  // Check if course exists and is published
  const { data: courseData, error: courseError } = await client
    .from(COURSES_TABLE)
    .select('id, status')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to fetch course',
      courseError,
    );
  }

  if (!courseData) {
    return failure(
      404,
      courseCatalogErrorCodes.courseNotFound,
      'Course not found',
    );
  }

  if (courseData.status !== 'published') {
    return failure(
      403,
      courseCatalogErrorCodes.courseNotPublished,
      'Cannot enroll in unpublished course',
    );
  }

  // Check if already enrolled
  const { data: existingEnrollment, error: checkError } = await client
    .from(ENROLLMENTS_TABLE)
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', userId)
    .maybeSingle();

  if (checkError) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to check enrollment status',
      checkError,
    );
  }

  if (existingEnrollment) {
    return failure(
      409,
      courseCatalogErrorCodes.alreadyEnrolled,
      'Already enrolled in this course',
    );
  }

  // Create enrollment
  const { error: insertError } = await client.from(ENROLLMENTS_TABLE).insert({
    course_id: courseId,
    learner_id: userId,
  });

  if (insertError) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to create enrollment',
      insertError,
    );
  }

  return success({ success: true });
};

// Service: Unenroll from course
export const unenrollFromCourse = async (
  client: SupabaseClient,
  courseId: string,
  userId: string,
): Promise<HandlerResult<{ success: boolean }, CourseCatalogServiceError, unknown>> => {
  // Check if course exists
  const { data: courseData, error: courseError } = await client
    .from(COURSES_TABLE)
    .select('id')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to fetch course',
      courseError,
    );
  }

  if (!courseData) {
    return failure(
      404,
      courseCatalogErrorCodes.courseNotFound,
      'Course not found',
    );
  }

  // Check if enrolled
  const { data: existingEnrollment, error: checkError } = await client
    .from(ENROLLMENTS_TABLE)
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', userId)
    .maybeSingle();

  if (checkError) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to check enrollment status',
      checkError,
    );
  }

  if (!existingEnrollment) {
    return failure(
      404,
      'NOT_ENROLLED' as CourseCatalogServiceError,
      'Not enrolled in this course',
    );
  }

  // Delete enrollment
  const { error: deleteError } = await client
    .from(ENROLLMENTS_TABLE)
    .delete()
    .eq('course_id', courseId)
    .eq('learner_id', userId);

  if (deleteError) {
    return failure(
      500,
      courseCatalogErrorCodes.supabaseError,
      'Failed to delete enrollment',
      deleteError,
    );
  }

  return success({ success: true });
};
