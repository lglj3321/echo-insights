/**
 * Vercel serverless entry point.
 *
 * The platform invokes this per request; it never listens on a port. Instances
 * are frozen between invocations and recycled without warning, so module scope
 * is the only cache available and it is per-instance.
 *
 * registerRoutes is async and mounts every handler onto the Express app.
 * Running it on each invocation would stack duplicate middleware and repeat the
 * cost, so it is guarded by a flag: the first request an instance serves pays
 * for registration, and every later request on that instance reuses it.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app, registerRoutes, errorHandler } from "./_lib/index.js";

let routesInitialized = false;

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (!routesInitialized) {
      await registerRoutes(app);
      // Error handlers must come last, so this cannot move above the routes.
      app.use(errorHandler);
      routesInitialized = true;
      console.log("Routes initialized (cold start)");
    }

    await app(req as any, res as any);
  } catch (error) {
    console.error("Unhandled Vercel handler error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
