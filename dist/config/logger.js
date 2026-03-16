"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const env_1 = require("./env");
const logDir = path_1.default.join(process.cwd(), "logs");
const jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp(), winston_1.default.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${metaString}`;
}));
exports.logger = winston_1.default.createLogger({
    level: env_1.env.NODE_ENV === "production" ? "info" : "debug",
    format: jsonFormat,
    transports: [
        new winston_1.default.transports.Console({ format: consoleFormat }),
        new winston_daily_rotate_file_1.default({
            dirname: logDir,
            filename: "app-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "14d",
        }),
        new winston_daily_rotate_file_1.default({
            dirname: logDir,
            filename: "error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "30d",
            level: "error",
        }),
    ],
});
//# sourceMappingURL=logger.js.map