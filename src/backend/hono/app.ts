import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerAuthRoutes } from '@/features/auth/backend/route';
import { registerCourseCatalogRoutes } from '@/features/course-catalog/backend/route';
import { registerLearnerDashboardRoutes } from '@/features/learner-dashboard/backend/route';
import { registerAssignmentRoutes } from '@/features/assignments/backend/route';
import { registerInstructorRoutes } from '@/features/instructor/backend/route';
import type { AppEnv } from '@/backend/hono/context';

const app = new Hono<AppEnv>();

app.use('*', errorBoundary());
app.use('*', withAppContext());
app.use('*', withSupabase());

registerExampleRoutes(app);
registerAuthRoutes(app);
registerCourseCatalogRoutes(app);
registerLearnerDashboardRoutes(app);
registerAssignmentRoutes(app);
registerInstructorRoutes(app);

// Debug: List all routes
app.get('/debug/routes', (c) => {
  const routes = app.routes.map((r) => ({
    method: r.method,
    path: r.path,
  }));
  return c.json({ routes });
});

export const createHonoApp = () => app;
