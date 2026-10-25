import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
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
    assert.ok(
      !result.commands.some((command) =>
        command.startsWith("npm run api:start"),
      ),
    );
  });

async function runNxStartup(mode, failingTarget = "") {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sps-api-direct-"));
  const repository = path.resolve(new URL("../../", import.meta.url).pathname);
  try {
    await mkdir(path.join(directory, "apps/api"), { recursive: true });
    await writeFile(path.join(directory, "nx.json"), "{}");
    await writeFile(path.join(directory, "package.json"), '{"private":true}');
    const project = JSON.parse(
      await readFile(
        new URL("../../apps/api/project.json", import.meta.url),
        "utf8",
      ),
    );
    await writeFile(
      path.join(directory, "apps/api/project.json"),
      JSON.stringify({
        ...project,
        targets: Object.fromEntries(
          ["dev", "start", "db:migrate"].map((name) => [
            name,
            project.targets[name],
          ]),
        ),
      }),
    );
    await copyFile(
      new URL("../../migrate.sh", import.meta.url),
      path.join(directory, "migrate.sh"),
    );
    await mkdir(path.join(directory, "node_modules/.bin"), { recursive: true });
    await symlink(
      path.join(repository, "node_modules/nx"),
      path.join(directory, "node_modules/nx"),
      "dir",
    );
    const log = path.join(directory, "commands.log");
    for (const executable of ["npx", "bun"]) {
      await writeFile(
        path.join(directory, "node_modules/.bin", executable),
        '#!/bin/bash\nprintf "%s %s\\n" "' +
          executable +
          '" "$*" >> "$STARTUP_LOG"\nif [ "$*" = "$FAILING_TARGET" ]; then exit 17; fi\n',
        { mode: 0o755 },
      );
    }
    const result = spawnSync(
      process.execPath,
      [
        path.join(repository, "node_modules/nx/bin/nx.js"),
        "run",
        `api:${mode}`,
      ],
      {
        cwd: directory,
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          NX_DAEMON: "false",
          NX_ISOLATE_PLUGINS: "false",
          NX_SKIP_NX_CACHE: "true",
          STARTUP_LOG: log,
          FAILING_TARGET: failingTarget,
        },
        encoding: "utf8",
        timeout: 30000,
      },
    );
    let commands = [];
    try {
      commands = (await readFile(log, "utf8")).trim().split("\n");
    } catch {}
    return { ...result, commands };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

for (const mode of ["dev", "start"]) {
  test(`direct api:${mode} launches Bun without migrations or seeding`, async () => {
    const result = await runNxStartup(mode);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.deepEqual(result.commands, [`bun run ${mode}`]);
  });
}

test("explicit database migration stops when infrastructure migration fails", async () => {
  const result = await runNxStartup(
    "db:migrate",
    "nx run @sps/providers-db:repository-migrate",
  );
  assert.notEqual(result.status, 0);
  assert.equal(
    result.commands.at(-1),
    "npx nx run @sps/providers-db:repository-migrate",
  );
  assert.ok(!result.commands.some((command) => command.startsWith("bun ")));
});
