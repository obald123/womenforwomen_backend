import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { errorHandler } from "./middleware/errorHandler";
import { authLimiter, adminLimiter, publicLimiter } from "./middleware/rateLimiters";
import authRoutes from "./modules/auth/routes";
import articlesRoutes from "./modules/articles/routes";
import eventsRoutes from "./modules/events/routes";
import galleryRoutes from "./modules/gallery/routes";
import teamRoutes from "./modules/team/routes";
import newsletterRoutes from "./modules/newsletter/routes";
import publicRoutes from "./modules/public/routes";
import messageRoutes from "./modules/messages/routes";
import searchRoutes from "./modules/search/routes";
import jobRoutes from "./modules/jobs/routes";
import uploadRoutes from "./modules/uploads/routes";
import impactReportRoutes from "./modules/impactReports/routes";

const app = express();

// Render (and most PaaS hosts) sit the app behind one reverse proxy hop, which
// sets X-Forwarded-For. Without this, express-rate-limit refuses to trust that
// header (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR) and req.ip falls back to the
// proxy's own IP, making per-client rate limiting ineffective.
app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

const origins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: origins,
    credentials: true,
  }),
);

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/articles", adminLimiter, articlesRoutes);
app.use("/api/events", adminLimiter, eventsRoutes);
app.use("/api/gallery", adminLimiter, galleryRoutes);
app.use("/api/team", adminLimiter, teamRoutes);
app.use("/api/newsletter", adminLimiter, newsletterRoutes);
app.use("/api/messages", adminLimiter, messageRoutes);
app.use("/api/search", adminLimiter, searchRoutes);
app.use("/api/jobs", adminLimiter, jobRoutes);
app.use("/api/uploads", adminLimiter, uploadRoutes);
app.use("/api/impact-reports", adminLimiter, impactReportRoutes);
app.use("/api/public", publicLimiter, publicRoutes);

app.use(errorHandler);

export default app;
