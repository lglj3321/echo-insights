// server/index.ts (Vercel-ready version)
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

// 1. 确保 './routes.ts' 和它导入的所有文件都使用了相对路径！
import { registerRoutes } from "./routes.ts"; 

// 2. 移除所有 Vercel 不需要的东西
// 移除了 import { setupVite, serveStatic, log } from "./vite";
// Vercel 会自动处理静态文件和日志

const app = express();

// --- 3. 保留所有 Express 中间件 ---
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // 保留 cookie-parser

// --- 4. 保留日志中间件，但使用 console.log ---
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      
      // 改为 console.log()，Vercel 会自动捕获
      console.log(logLine); 
    }
  });

  next();
});

// --- 5. 核心修改：移除 (async () => { ... }) IIFE ---
// 我们使用 "top-level await" 来配置路由
// 假设 registerRoutes 会修改 app 对象
await registerRoutes(app);

// --- 6. 保留错误处理中间件 ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("API Error:", err); // 在 Vercel 日志中打印真实错误
  res.status(status).json({ message });
});

// --- 7. 移除所有 Vercel 不需要的部分 ---
// 移除了 if (app.get("env") === "development") { ... }
// 移除了 server.listen(...)
// Vercel 会自动处理这些

// --- 8. 导出 app，供 api/index.ts 导入 ---
export default app;