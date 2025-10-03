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
  getLearnerDashboard,
  checkLearnerRole,
} from '@/features/learner-dashboard/backend/service';
import {
  learnerDashboardErrorCodes,
  type LearnerDashboardServiceError,
} from '@/features/learner-dashboard/backend/error';

export const registerLearnerDashboardRoutes = (app: Hono<AppEnv>) => {
  // GET /learner/dashboard - Get learner dashboard data
  app.get('/learner/dashboard', async (c) => {

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

    const result = await getLearnerDashboard(supabase, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<LearnerDashboardServiceError, unknown>;

      if (
        errorResult.error.code === learnerDashboardErrorCodes.supabaseError ||
        errorResult.error.code === learnerDashboardErrorCodes.validationError
      ) {
        logger.error('Learner dashboard fetch failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
