import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

// 扩展 Express Request 类型以包含 user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string | null;
        fullName: string | null;
      };
    }
  }
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 验证密码
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// 认证中间件 - 检查用户是否已登录
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// 可选认证中间件 - 如果已登录则设置 req.user
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.session?.userId) {
    const user = await storage.getUser(req.session.userId);
    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      };
    }
  }
  next();
}

// 用户注册
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<{ id: string; username: string; email: string | null }> {
  // 检查用户名是否已存在
  const existingUser = await storage.getUserByUsername(username);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  // 哈希密码
  const hashedPassword = await hashPassword(password);

  // 创建用户
  const user = await storage.createUser({
    username,
    password: hashedPassword,
  });

  // 如果提供了邮箱，更新用户信息
  if (email) {
    await storage.updateUser(user.id, { email });
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

// 用户登录
export async function loginUser(
  username: string,
  password: string
): Promise<{ id: string; username: string; email: string | null }> {
  // 查找用户
  const user = await storage.getUserByUsername(username);
  if (!user) {
    throw new Error("Invalid username or password");
  }

  // 验证密码
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error("Invalid username or password");
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

