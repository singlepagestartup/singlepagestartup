import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

async function runStartup(failingTarget = "") {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sps-api-startup-"));
  try {
    for (const name of ["start.sh", "migrate.sh"])
      await copyFile(
        new URL(`../../${name}`, import.meta.url),
        path.join(directory, name),
      );
    const log = path.join(directory, "commands.log");
    await writeFile(
      path.join(directory, "create_env.sh"),
      "#!/bin/bash\nexit 0\n",
      { mode: 0o755 },
    );
    await writeFile(
      path.join(directory, "npx"),
      '#!/bin/bash\nprintf "%s\\n" "$*" >> "$STARTUP_LOG"\nif [ "$*" = "$FAILING_TARGET" ]; then exit 17; fi\n',
      { mode: 0o755 },
    );
    await writeFile(
      path.join(directory, "npm"),
      '#!/bin/bash\nprintf "npm %s\\n" "$*" >> "$STARTUP_LOG"\n',
      { mode: 0o755 },
    );
    const result = spawnSync("bash", ["start.sh", "api"], {
      cwd: directory,
      env: {
        ...process.env,
        PATH: `${directory}:${process.env.PATH}`,
        STARTUP_LOG: log,
        FAILING_TARGET: failingTarget,
      },
      encoding: "utf8",
    });
    return {
      status: result.status,
      stderr: result.stderr,
      commands: (await readFile(log, "utf8")).trim().split("\n"),
    };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("API starts only after infrastructure, model migrations and seed complete", async () => {
  const result = await runStartup();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.commands[0],
    "nx run @sps/providers-db:repository-migrate",
  );
  assert.ok(result.commands.includes("nx run @sps/social:repository-migrate"));
  assert.deepEqual(result.commands.slice(-2), [
    "nx run api:db:seed",
    "npm run api:start",
  ]);
});

for (const target of [
  "@sps/providers-db:repository-migrate",
  "@sps/social:repository-migrate",
  "api:db:seed",
])
  test(`API remains stopped when ${target} fails`, async () => {
    const result = await runStartup(`nx run ${target}`);
    assert.equal(result.status, 17, result.stderr);
    assert.equal(result.commands.at(-1), `nx run ${target}`);
    assert.ok(!result.commands.includes("npm run api:start"));
  });
