export function getLoggerConfig() {
  return {
    provider: process.env.LOG_PROVIDER || "console", // "pino" / "console"
    level: process.env.LOG_LEVEL || "info",
    isDev: process.env.NODE_ENV === "development",
  };
}
