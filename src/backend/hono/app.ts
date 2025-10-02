import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerAuthRoutes } from '@/features/auth/backend/route';
import type { AppEnv } from '@/backend/hono/context';

const app = new Hono<AppEnv>();

app.use('*', errorBoundary());
app.use('*', withAppContext());
app.use('*', withSupabase());

registerExampleRoutes(app);
registerAuthRoutes(app);

// Debug: List all routes
app.get('/debug/routes', (c) => {
  const routes = app.routes.map((r) => ({
    method: r.method,
    path: r.path,
  }));
  return c.json({ routes });
});

console.log('Hono app initialized with routes:');
app.routes.forEach((route) => {
  console.log(`  ${route.method} ${route.path}`);
});

export const createHonoApp = () => app;
