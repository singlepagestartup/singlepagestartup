import dotenv from "dotenv";
import path from "path";

let loaded = false;

export function loadScenarioEnv() {
  if (loaded) {
    return;
  }

  dotenv.config({
    path: path.resolve(process.cwd(), "apps/api/.env"),
  });

  dotenv.config({
    path: path.resolve(process.cwd(), "apps/host/.env.local"),
  });

  loaded = true;
}

export function getRequiredEnv(name: string): string {
  loadScenarioEnv();

  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }

  return value;
}

export function getApiUrl(): string {
  loadScenarioEnv();

  return process.env["API_SERVICE_URL"] || "http://localhost:4000";
}
