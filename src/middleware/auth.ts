import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthError } from "../utils/errors";

export type AuthPayload = {
  sub: string;
  jti: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const cookieToken = req.cookies?.accessToken as string | undefined;
  const accessToken = token || cookieToken;

  if (!accessToken) throw new AuthError("Missing access token");

  try {
    const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = { id: decoded.sub };
    req.tokenId = decoded.jti;
    next();
  } catch {
    throw new AuthError("Invalid or expired access token");
  }
}