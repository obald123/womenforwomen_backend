import rateLimit from "express-rate-limit";

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const isProd = process.env.NODE_ENV === "production";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
