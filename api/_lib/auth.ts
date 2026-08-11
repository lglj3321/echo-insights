import bcrypt from "bcrypt";
import { storage } from "./storage.js";
import { insertUserSchema } from "../../shared/schema.js";
import type { Request, Response, NextFunction } from "express";
import { extractToken, verifyToken } from "./jwt.js";

// The Express Request augmentation carrying `req.user` lives in jwt.ts.

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/** Rejects the request unless it carries a valid JWT for an existing user. */
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

/**
 * Attaches `req.user` when a valid token is present, but lets anonymous
 * requests through. Used on the consumer survey routes, which must work
 * without an account.
 */
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
    // Anonymous access is allowed here, so a bad token is not fatal.
  }

  next();
}

/**
 * Loads the project named by `:id`/`:projectId` and rejects the request unless
 * the caller owns it, then hands the project on via `res.locals.project`.
 *
 * Mount after requireAuth. Centralising the check keeps every mutating route
 * consistent — an earlier revision applied it ad hoc and several routes were
 * left reachable without any credentials at all.
 */
export async function requireProjectOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const projectId = req.params.projectId ?? req.params.id;
  if (!projectId) {
    res.status(400).json({ error: "Project id is required" });
    return;
  }

  const project = await storage.getProject(projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden: you do not own this project" });
    return;
  }

  res.locals.project = project;
  next();
}

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

