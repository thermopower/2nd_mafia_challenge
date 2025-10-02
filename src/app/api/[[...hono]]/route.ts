import { createHonoApp } from '@/backend/hono/app';

const app = createHonoApp();

const handler = async (req: Request) => {
  console.log('Route handler called:', req.method, req.url);

  // Remove /api prefix from the URL for Hono
  const url = new URL(req.url);
  const pathWithoutApi = url.pathname.replace(/^\/api/, '');
  const newUrl = new URL(pathWithoutApi + url.search, url.origin);

  console.log('Original path:', url.pathname);
  console.log('Path for Hono:', pathWithoutApi);

  const newReq = new Request(newUrl, req);
  return app.fetch(newReq);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

export const runtime = 'nodejs';
