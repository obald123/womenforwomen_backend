import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  let status = err instanceof AppError ? err.statusCode : 500;
  let message = err instanceof AppError ? err.message : "Internal server error";

  const isMulterError = (err as any)?.name === "MulterError";
  if (isMulterError) {
    const code = (err as any)?.code;
    if (code === "LIMIT_FILE_SIZE") {
      status = 413;
      message = "File too large (max 10MB)";
    } else {
      status = 400;
      message = "Invalid upload";
    }
  }

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
