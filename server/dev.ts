/**
 * Local development entry point.
 *
 * Production runs on Vercel, where `api/index.ts` wraps the Express app in a
 * serverless handler. That handler never listens on a port — the platform
 * invokes it per request. This file is the second entry point onto the *same*
 * app: it registers the routes once, attaches Vite in middleware mode for HMR,
 * and listens on a port so the whole thing can be run and debugged locally.
 *
 * Keeping both entries thin, with all routing and storage in `api/_lib`, is
 * what stops the two environments from drifting apart.
 */
import { createServer } from "http";
import { app, registerRoutes, errorHandler } from "../api/_lib/index.js";
import { setupVite, serveStatic, log } from "./vite.js";

const port = parseInt(process.env.PORT || "3000", 10);
const isProduction = process.env.NODE_ENV === "production";

async function main() {
  const server = createServer(app);

  await registerRoutes(app);
  app.use(errorHandler);

  // Vite must be attached after the API routes so its catch-all does not
  // swallow /api requests.
  if (isProduction) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on http://localhost:${port}`);
    log(
      process.env.DATABASE_URL
        ? "storage: PostgreSQL"
        : "storage: in-memory (set DATABASE_URL to persist)",
    );
  });
}

main().catch((error) => {
  console.error("Failed to start dev server:", error);
  process.exit(1);
});
