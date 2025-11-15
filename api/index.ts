/**
 * Vercel Serverless Function Entry Point
 * This file is used when deploying to Vercel
 * 
 * Note: For Vercel deployment, we use the standard Express app setup
 * The server/index.ts file will be used directly
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// For Vercel, we'll use a simpler approach - just import and use the Express app
// This requires the app to be exported from server/index.ts or we create it here

// Since Vercel serverless functions work differently, we'll create a handler
// that initializes the Express app on first invocation

let app: any = null;
let initialized = false;

async function getApp() {
  if (initialized && app) {
    return app;
  }

  // Dynamically import to avoid issues with server-side code in Vercel
  const { default: express } = await import('express');
  const { registerRoutes } = await import('../server/routes');
  const { setupVite, serveStatic } = await import('../server/vite');
  const cookieParser = (await import('cookie-parser')).default;

  app = express();

  // Middleware
  app.use(cookieParser());
  app.use(express.json({
    verify: (req: any, _res: any, buf: any) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false }));

  // Register routes and get server
  const server = await registerRoutes(app);

  // Set up static serving for production
  if (process.env.NODE_ENV !== 'development') {
    serveStatic(app);
  }

  initialized = true;
  return { app, server };
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { app: expressApp } = await getApp();
    
    // Convert Vercel request/response to Express format
    return new Promise((resolve) => {
      expressApp(req as any, res as any, () => {
        resolve(undefined);
      });
    });
  } catch (error: any) {
    console.error('Vercel handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

