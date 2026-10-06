export const TELEGRAM_SERVICE_BOT_TOKEN =
  process.env["TELEGRAM_SERVICE_BOT_TOKEN"];
export const TELEGRAM_SERVICE_BOT_USERNAME =
  process.env["TELEGRAM_SERVICE_BOT_USERNAME"];
// Shared with Telegram through setWebhook and returned on every delivery as
// X-Telegram-Bot-Api-Secret-Token. No default: an absent value must fail the
// service closed rather than silently accept unsigned updates.
export const TELEGRAM_SERVICE_WEBHOOK_SECRET =
  process.env["TELEGRAM_SERVICE_WEBHOOK_SECRET"];
export const TELEGRAM_SERVICE_URL =
  process.env["TELEGRAM_SERVICE_URL"] ?? "http://localhost:8000";
export const NEXT_PUBLIC_TELEGRAM_SERVICE_URL =
  process.env["NEXT_PUBLIC_TELEGRAM_SERVICE_URL"] ?? "http://localhost:8000";
export const TELEGRAM_SERVICE_PORT =
  Number(process.env["TELEGRAM_SERVICE_PORT"]) || 8000;
export const TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID =
  process.env["TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID"] ?? "";
export const TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME =
  process.env["TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME"] ?? "";
export const TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK =
  process.env["TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK"] ?? "";
/**
 * `enforce` refuses to start on a legacy `RBAC_SECRET_KEY` or `RBAC_JWT_SECRET`,
 * as the API does under `API_SECRET_STRENGTH`. `report` logs the same findings
 * and starts anyway, for a deployment that cannot rotate in the same window.
 */
export const TELEGRAM_SECRET_STRENGTH: "enforce" | "report" =
  process.env["TELEGRAM_SECRET_STRENGTH"] === "report" ? "report" : "enforce";
