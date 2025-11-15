import bcrypt from "bcrypt";
import { storage } from "./storage.js";
import { insertUserSchema } from "../../shared/schema.js";
import type { Request, Response, NextFunction } from "express";
import { extractToken, verifyToken } from "./jwt.js";

// 确保 Express Request 类型扩展已加载（从 jwt.ts）
// 类型定义在 jwt.ts 中，这里只是确保导入

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

// 认证中间件 - 检查用户是否已登录（使用 JWT）
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({ error: "Unauthorized: No token provided" });
      return;
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
      return;
    }

    // 从数据库获取用户信息（可选，用于验证用户仍然存在）
    const user = await storage.getUser(payload.userId);
    if (!user) {
      res.status(401).json({ error: "Unauthorized: User not found" });
      return;
    }

    // 设置 req.user
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Token verification failed" });
  }
}

// 可选认证中间件 - 如果已登录则设置 req.user
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (token) {
      const payload = verifyToken(token);
      
      if (payload) {
        const user = await storage.getUser(payload.userId);
        if (user) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
          };
        }
      }
    }
  } catch (error) {
    // 忽略错误，继续执行（可选认证）
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

