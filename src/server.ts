import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";


const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`API listening on port ${env.PORT} (host: 0.0.0.0)`);
});

function shutdown(signal: string) {
  logger.warn(`Received ${signal}. Shutting down.`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("UnhandledPromiseRejection:", reason);
});
