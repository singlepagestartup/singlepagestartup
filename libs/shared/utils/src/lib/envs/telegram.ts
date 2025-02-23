import { API_SERVICE_URL } from "./host";

export const TELEGRAM_BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
export const TELEGRAM_BOT_API_SERVICE_URL =
  process.env["TELEGRAM_BOT_API_SERVICE_URL"] ?? API_SERVICE_URL;
