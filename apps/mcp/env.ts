import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envProductionPath = path.resolve(__dirname, ".env.production");
const envPath = path.resolve(__dirname, ".env");
const apiEnvPath = path.resolve(__dirname, "../api/.env");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (process.env["NODE_ENV"] === "production") {
  dotenv.config({ path: envProductionPath });
} else {
  dotenv.config();
}

if (process.env["NODE_ENV"] !== "production" && existsSync(apiEnvPath)) {
  dotenv.config({ path: apiEnvPath });
}
