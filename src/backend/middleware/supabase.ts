import { createMiddleware } from 'hono/factory';
import {
  contextKeys,
  type AppEnv,
} from '@/backend/hono/context';
import { createServiceClient } from '@/backend/supabase/client';

export const withSupabase = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = c.get(
      contextKeys.config,
    ) as AppEnv['Variables']['config'] | undefined;

    if (!config) {
      throw new Error('Application configuration is not available.');
    }

    const client = createServiceClient(config.supabase);

    // Extract auth token from Authorization header and store it in context
    const authHeader = c.req.header('Authorization');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Token extracted, length:', token.length);
      // Store the JWT token in context for later use
      c.set('userToken', token);
    }

    c.set(contextKeys.supabase, client);

    await next();
  });
