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
import { SignupRequestSchema } from '@/features/auth/backend/schema';
import { getLatestTermsVersion, getUserProfile, signupUser } from './service';
import {
  authSignupErrorCodes,
  type AuthSignupServiceError,
} from './error';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  console.log('Registering auth routes...');

  const signupRoute = app.post('/auth/signup', async (c) => {
    console.log('POST /auth/signup called');
    const body = await c.req.json();
    const parsedBody = SignupRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_SIGNUP_PAYLOAD',
          '입력값이 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await signupUser(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthSignupServiceError, unknown>;

      if (
        errorResult.error.code === authSignupErrorCodes.supabaseAuthFailed ||
        errorResult.error.code === authSignupErrorCodes.profileCreationFailed ||
        errorResult.error.code === authSignupErrorCodes.termsAcceptanceFailed
      ) {
        logger.error('Signup failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  const termsRoute = app.get('/auth/terms/latest', async (c) => {
    console.log('GET /auth/terms/latest called');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getLatestTermsVersion(supabase);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthSignupServiceError, unknown>;

      if (errorResult.error.code === authSignupErrorCodes.supabaseAuthFailed) {
        logger.error('Failed to fetch latest terms', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  const profileRoute = app.get('/auth/profile', async (c) => {
    console.log('GET /auth/profile called');
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

    const result = await getUserProfile(supabase, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthSignupServiceError, unknown>;

      if (
        errorResult.error.code === authSignupErrorCodes.supabaseAuthFailed ||
        errorResult.error.code === authSignupErrorCodes.profileCreationFailed
      ) {
        logger.error('Failed to fetch user profile', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  console.log('Auth routes registered:', {
    signup: signupRoute ? 'POST /auth/signup' : 'FAILED',
    terms: termsRoute ? 'GET /auth/terms/latest' : 'FAILED',
    profile: profileRoute ? 'GET /auth/profile' : 'FAILED',
  });
};
