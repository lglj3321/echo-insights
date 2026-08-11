import jwt from "jsonwebtoken";
import type { Request } from "express";

// Augments Express so authenticated handlers can read req.user.
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

// The fallback exists so the app boots without configuration. It is public
// and therefore worthless as a secret — JWT_SECRET must be set in deployment.
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/** Claims carried in the token. */
export interface TokenPayload {
  userId: string;
  username: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, username: payload.username } as jwt.JwtPayload,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  );
}

/** Returns the claims, or null if the token is absent, expired or forged. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/** Reads the bearer token from the Authorization header, or the cookie. */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
}
