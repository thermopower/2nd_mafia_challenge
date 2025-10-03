import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  CourseCatalogQuerySchema,
  CourseIdParamSchema,
} from '@/features/course-catalog/backend/schema';
import {
  getCourseCatalog,
  getCourseDetail,
  enrollInCourse,
  unenrollFromCourse,
  checkLearnerRole,
} from '@/features/course-catalog/backend/service';
import {
  courseCatalogErrorCodes,
  type CourseCatalogServiceError,
} from '@/features/course-catalog/backend/error';

export const registerCourseCatalogRoutes = (app: Hono<AppEnv>) => {
  console.log('Registering course catalog routes...');

  // GET /catalog/courses - List courses with filters
  const catalogListRoute = app.get('/catalog/courses', async (c) => {
    console.log('GET /catalog/courses called');

    const queryParams = c.req.query();
    const parsedQuery = CourseCatalogQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          courseCatalogErrorCodes.invalidFilter,
          'Invalid query parameters',
          parsedQuery.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getCourseCatalog(supabase, parsedQuery.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CourseCatalogServiceError, unknown>;

      if (
        errorResult.error.code === courseCatalogErrorCodes.supabaseError ||
        errorResult.error.code === courseCatalogErrorCodes.validationError
      ) {
        logger.error('Course catalog fetch failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // GET /catalog/courses/:id - Get course detail with enrollment status
  const courseDetailRoute = app.get('/catalog/courses/:id', async (c) => {
    console.log('GET /catalog/courses/:id called');

    const params = c.req.param();
    const parsedParams = CourseIdParamSchema.safeParse(params);

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          courseCatalogErrorCodes.invalidFilter,
          'Invalid course ID',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get user from auth token (optional - guests can view course details)
    const token = c.get('userToken' as any) as string | undefined;
    let userId: string | undefined = undefined;

    if (token) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (!authError && user) {
        userId = user.id;
      }
    }

    const result = await getCourseDetail(
      supabase,
      parsedParams.data.id,
      userId,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<CourseCatalogServiceError, unknown>;

      if (
        errorResult.error.code === courseCatalogErrorCodes.supabaseError ||
        errorResult.error.code === courseCatalogErrorCodes.validationError ||
        errorResult.error.code === courseCatalogErrorCodes.courseNotFound
      ) {
        logger.error('Course detail fetch failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // POST /catalog/courses/:id/enroll - Enroll in course
  const enrollRoute = app.post('/catalog/courses/:id/enroll', async (c) => {
    console.log('POST /catalog/courses/:id/enroll called');

    const params = c.req.param();
    const parsedParams = CourseIdParamSchema.safeParse(params);

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          courseCatalogErrorCodes.invalidFilter,
          'Invalid course ID',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get user from auth token
    const token = c.get('userToken' as any) as string | undefined;

    if (!token) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Authentication required'),
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('Auth error:', authError);
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Invalid or expired token'),
      );
    }

    // Check if user is learner
    const roleCheck = await checkLearnerRole(supabase, user.id);

    if (!roleCheck.ok) {
      return respond(c, roleCheck);
    }

    const result = await enrollInCourse(
      supabase,
      parsedParams.data.id,
      user.id,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<CourseCatalogServiceError, unknown>;

      if (
        errorResult.error.code === courseCatalogErrorCodes.supabaseError ||
        errorResult.error.code === courseCatalogErrorCodes.courseNotFound ||
        errorResult.error.code === courseCatalogErrorCodes.courseNotPublished ||
        errorResult.error.code === courseCatalogErrorCodes.alreadyEnrolled
      ) {
        logger.error('Course enrollment failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // DELETE /catalog/courses/:id/enroll - Unenroll from course
  const unenrollRoute = app.delete('/catalog/courses/:id/enroll', async (c) => {
    console.log('DELETE /catalog/courses/:id/enroll called');

    const params = c.req.param();
    const parsedParams = CourseIdParamSchema.safeParse(params);

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          courseCatalogErrorCodes.invalidFilter,
          'Invalid course ID',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // Get user from auth token
    const token = c.get('userToken' as any) as string | undefined;

    if (!token) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Authentication required'),
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('Auth error:', authError);
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', 'Invalid or expired token'),
      );
    }

    // Check if user is learner
    const roleCheck = await checkLearnerRole(supabase, user.id);

    if (!roleCheck.ok) {
      return respond(c, roleCheck);
    }

    const result = await unenrollFromCourse(
      supabase,
      parsedParams.data.id,
      user.id,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<CourseCatalogServiceError, unknown>;

      logger.error('Course unenrollment failed', errorResult.error.message);

      return respond(c, result);
    }

    return respond(c, result);
  });

  console.log('Course catalog routes registered:', {
    list: catalogListRoute ? 'GET /catalog/courses' : 'FAILED',
    detail: courseDetailRoute ? 'GET /catalog/courses/:id' : 'FAILED',
    enroll: enrollRoute ? 'POST /catalog/courses/:id/enroll' : 'FAILED',
    unenroll: unenrollRoute ? 'DELETE /catalog/courses/:id/enroll' : 'FAILED',
  });
};
