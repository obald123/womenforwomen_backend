"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const server = app_1.default.listen(env_1.env.PORT, () => {
    logger_1.logger.info(`API listening on port ${env_1.env.PORT}`);
});
function shutdown(signal) {
    logger_1.logger.warn(`Received ${signal}. Shutting down.`);
    server.close(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("UnhandledPromiseRejection:", reason);
});
//# sourceMappingURL=server.js.map