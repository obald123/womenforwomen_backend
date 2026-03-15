import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : "Internal server error";

  logger.error(message, {
    path: req.path,
    method: req.method,
    status,
    error: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });

  res.status(status).json({
    success: false,
    message,
    ...(err instanceof AppError && err.details ? { details: err.details } : {}),
  });
}