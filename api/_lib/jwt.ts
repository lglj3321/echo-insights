import jwt from "jsonwebtoken";
import type { Request } from "express";

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

// JWT Secret（应该从环境变量读取，生产环境必须使用强密钥）
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // 7天

// Token 载荷接口
export interface TokenPayload {
  userId: string;
  username: string;
}

// 生成 JWT Token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, username: payload.username } as jwt.JwtPayload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );
}

// 验证 JWT Token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// 从请求头提取 Token
export function extractToken(req: Request): string | null {
  // 从 Authorization header 提取: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  // 也可以从 cookie 中读取（如果前端使用 cookie）
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  
  return null;
}
