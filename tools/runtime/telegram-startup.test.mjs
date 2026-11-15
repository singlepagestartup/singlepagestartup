import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../", import.meta.url));
const bun = join(root, "node_modules/bun/bin/bun.exe");

function executeWithoutDatabase(source) {
  const directory = mkdtempSync(join(tmpdir(), "sps-telegram-startup-"));
  try {
    return spawnSync(
      bun,
      [
        "--no-env-file",
        "--tsconfig-override",
        join(root, "apps/telegram/tsconfig.json"),
        "--eval",
        source,
      ],
      {
        cwd: directory,
        env: { PATH: process.env.PATH, NODE_ENV: "test" },
        encoding: "utf8",
        timeout: 30000,
      },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("Telegram serves its health route without application database credentials", () => {
  const entry = join(root, "apps/telegram/app.ts");
  const result = executeWithoutDatabase(`
    const { app } = await import(${JSON.stringify(entry)});
    const response = await app.request("/");
    if (response.status !== 200 || await response.text() !== "OK") {
      throw new Error("Telegram health route failed");
    }
    console.log("TELEGRAM_READY");
    process.exit(0);
  `);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /TELEGRAM_READY/);
});

test("loading shared backend components preserves credential validation on database use", () => {
  const entry = join(root, "libs/shared/backend/api/src/index.ts");
  const database = join(
    root,
    "libs/shared/backend/database/config/src/index.ts",
  );
  const result = executeWithoutDatabase(`
    await import(${JSON.stringify(entry)});
    const { getPostgresClient } = await import(${JSON.stringify(database)});
    let refused = false;
    try {
      getPostgresClient();
    } catch (error) {
      refused = error.message.includes("Set DATABASE_USERNAME and DATABASE_PASSWORD");
    }
    if (!refused) {
      throw new Error("Database use must require application credentials");
    }
    console.log("DATABASE_GUARD_PRESERVED");
    process.exit(0);
  `);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /DATABASE_GUARD_PRESERVED/);
});
