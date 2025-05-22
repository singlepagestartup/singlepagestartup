export const TELEGRAM_SERVICE_BOT_TOKEN =
  process.env["TELEGRAM_SERVICE_BOT_TOKEN"];
export const TELEGRAM_SERVICE_URL =
  process.env["TELEGRAM_SERVICE_URL"] ?? "http://localhost:8000";
export const TELEGRAM_SERVICE_PORT =
  Number(process.env["TELEGRAM_SERVICE_PORT"]) || 8000;
