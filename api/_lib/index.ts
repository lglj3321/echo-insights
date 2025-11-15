// server/index.ts (Vercel-ready version 3.0)
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

// 1. 导入 registerRoutes (移除 .ts)
// 我们在这里导入它，但不在 Vercel 生产环境中使用它
// 我们将把它和 app 一起导出
import { registerRoutes } from "./routes.js"; 

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

// --- 4. 保留日志中间件 ---
// --- 4. 保留日志中间件 ---
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path; // <-- 1. 确保 path 已定义
  let capturedJsonResponse: Record<string, any> | undefined = undefined; // <-- 2. 确保 capturedJsonResponse 已定义

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) { // <-- 3. 确保这个逻辑存在
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      
      // --- (!!!) 关键修复在这里 (!!!) ---
      // 在使用 logLine 之前定义它
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      // --- 修复结束 ---
      
      // 改为 console.log()，Vercel 会自动捕获
      console.log(logLine); 
    }
  });

  next();
});

// --- 5. 核心修改：移除 TOP-LEVEL AWAIT ---
// 我们不再在这里 await 路由。
// 我们将在 api/index.ts 中处理异步路由注册。

// --- 6. 保留错误处理中间件 ---
// 注意：这个中间件应该在 registerRoutes 之后添加
// 我们将在 api/index.ts 中处理

// --- 8. 导出 app 和 registerRoutes ---
export { app, registerRoutes };

// 错误处理程序也应该被导出，以便在 api/index.ts 中最后添加
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("API Error:", err); // 在 Vercel 日志中打印真实错误
  res.status(status).json({ message });
};