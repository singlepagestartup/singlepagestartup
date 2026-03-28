import type { Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const API_SCRIPTS_DIR = path.resolve(process.cwd(), "apps/api");
const API_ENV_PATH = path.join(API_SCRIPTS_DIR, ".env");
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

function readApiEnvValue(key: string): string | undefined {
  if (!fs.existsSync(API_ENV_PATH)) {
    return undefined;
  }

  const content = fs.readFileSync(API_ENV_PATH, "utf-8");
  const line = content
    .split("\n")
    .find((currentLine) => currentLine.startsWith(`${key}=`));

  if (!line) {
    return undefined;
  }

  const value = line.slice(key.length + 1).trim();
  return value.length ? value : undefined;
}

function getScriptPath(scriptName: string): string {
  return path.join(API_SCRIPTS_DIR, scriptName);
}

function formatExecError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const stdout = (error as { stdout?: Buffer | string }).stdout;
  const stderr = (error as { stderr?: Buffer | string }).stderr;

  const stdoutText =
    typeof stdout === "string" ? stdout : stdout?.toString("utf-8") || "";
  const stderrText =
    typeof stderr === "string" ? stderr : stderr?.toString("utf-8") || "";

  return [error.message, stdoutText.trim(), stderrText.trim()]
    .filter((value) => value.length)
    .join("\n");
}

function runLifecycleScript(scriptName: string, label: string): void {
  const scriptPath = getScriptPath(scriptName);

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Missing lifecycle script: ${scriptPath}`);
  }

  console.log(`[rbac-lifecycle] ${label}: ${scriptName}`);

  try {
    const output = execFileSync("bash", [scriptPath], {
      cwd: API_SCRIPTS_DIR,
      encoding: "utf-8",
      timeout: 120_000,
    });

    if (output.trim().length) {
      console.log(`[rbac-lifecycle] ${label} output:\n${output.trim()}`);
    }
  } catch (error) {
    throw new Error(
      `[rbac-lifecycle] ${label} failed:\n${formatExecError(error)}`,
    );
  }
}

function getAdminCredentials(): { email: string; password: string } {
  const email =
    process.env.RBAC_SUBJECT_IDENTITY_EMAIL ||
    readApiEnvValue("RBAC_SUBJECT_IDENTITY_EMAIL") ||
    "admin@example.com";
  const password =
    process.env.RBAC_SUBJECT_IDENTITY_PASSWORD ||
    readApiEnvValue("RBAC_SUBJECT_IDENTITY_PASSWORD") ||
    "Password123!";

  return { email, password };
}

export function provisionAdminRbacSubjectForE2E(): void {
  runLifecycleScript("create_rbac_subject.sh", "create-admin-subject");
}

export function cleanupAdminRbacSubjectForE2E(): void {
  runLifecycleScript("delete_rbac_subject.sh", "delete-admin-subject");
}

export async function authenticateAdminRbacSession(page: Page): Promise<void> {
  const { email, password } = getAdminCredentials();

  const response = await page.request.post(
    "/api/rbac/subjects/authentication/email-and-password/authentication",
    {
      multipart: {
        data: JSON.stringify({
          login: email,
          password,
        }),
      },
    },
  );

  if (!response.ok()) {
    throw new Error(
      `Admin authentication failed with status ${response.status()}`,
    );
  }

  const payload = (await response.json()) as {
    data?: { jwt?: string; refresh?: string };
    jwt?: string;
    refresh?: string;
  };

  const tokenData = payload.data || payload;
  const jwt = tokenData.jwt;
  const refresh = tokenData.refresh;

  if (!jwt || !refresh) {
    throw new Error(
      "Admin authentication payload does not include jwt/refresh tokens",
    );
  }

  await page.context().addCookies([
    {
      name: "rbac.subject.jwt",
      value: jwt,
      url: DEFAULT_BASE_URL,
    },
  ]);

  await page.addInitScript((refreshToken: string) => {
    window.localStorage.setItem("rbac.subject.refresh", refreshToken);
  }, refresh);
}
