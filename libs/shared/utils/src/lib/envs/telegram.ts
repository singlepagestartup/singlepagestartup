import { BACKEND_URL } from "./host";

export const TELEGRAM_BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
export const TELEGRAM_BOT_BACKEND_URL =
  process.env["TELEGRAM_BOT_BACKEND_URL"] ?? BACKEND_URL;
