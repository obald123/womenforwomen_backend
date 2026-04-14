"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiters_1 = require("./middleware/rateLimiters");
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/articles/routes"));
const routes_3 = __importDefault(require("./modules/events/routes"));
const routes_4 = __importDefault(require("./modules/gallery/routes"));
const routes_5 = __importDefault(require("./modules/team/routes"));
const routes_6 = __importDefault(require("./modules/newsletter/routes"));
const routes_7 = __importDefault(require("./modules/public/routes"));
const routes_8 = __importDefault(require("./modules/messages/routes"));
const routes_9 = __importDefault(require("./modules/search/routes"));
const routes_10 = __importDefault(require("./modules/jobs/routes"));
const routes_11 = __importDefault(require("./modules/uploads/routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "2mb" }));
const origins = env_1.env.CORS_ORIGINS.split(",").map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: origins,
    credentials: true,
}));
app.use((0, morgan_1.default)("combined", {
    stream: { write: (message) => logger_1.logger.info(message.trim()) },
}));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", rateLimiters_1.authLimiter, routes_1.default);
app.use("/api/articles", rateLimiters_1.adminLimiter, routes_2.default);
app.use("/api/events", rateLimiters_1.adminLimiter, routes_3.default);
app.use("/api/gallery", rateLimiters_1.adminLimiter, routes_4.default);
app.use("/api/team", rateLimiters_1.adminLimiter, routes_5.default);
app.use("/api/newsletter", rateLimiters_1.adminLimiter, routes_6.default);
app.use("/api/messages", rateLimiters_1.adminLimiter, routes_8.default);
app.use("/api/search", rateLimiters_1.adminLimiter, routes_9.default);
app.use("/api/jobs", rateLimiters_1.adminLimiter, routes_10.default);
app.use("/api/uploads", rateLimiters_1.adminLimiter, routes_11.default);
app.use("/api/public", rateLimiters_1.publicLimiter, routes_7.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map