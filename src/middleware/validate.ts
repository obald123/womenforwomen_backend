import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import { ValidationError } from "../utils/errors";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!parsed.success) {
      throw new ValidationError("Invalid request", parsed.error.flatten());
    }
    next();
  };
}