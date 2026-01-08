import dotenv from "dotenv";
import { existsSync } from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envProductionPath = path.resolve(__dirname, ".env.production");
const envPath = path.resolve(__dirname, ".env");

if (existsSync(envProductionPath)) {
  dotenv.config({ path: envProductionPath });
}

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}
