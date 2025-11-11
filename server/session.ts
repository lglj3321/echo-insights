import session from "express-session";
import MemoryStore from "memorystore";
import type { Express } from "express";

// 扩展 session 类型
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// 创建 session store
const MemoryStoreSession = MemoryStore(session);

// 配置 session
export function setupSession(app: Express): void {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // 清理过期session，每天检查一次
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production", // 生产环境使用 HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
        sameSite: "lax",
      },
    })
  );
}

