import assert from "node:assert/strict";
import { test } from "node:test";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import YAML from "yaml";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const deployer = path.join(root, "tools/deployer");
const scriptNames = ["github_deployer.sh", "github_releaser.sh"];

function entries(script, group) {
  const text = readFileSync(path.join(deployer, script), "utf8");
  const block = text.split(`${group}=(\n`)[1].split("\n)")[0];
  return [...block.matchAll(/"(\w+) \$(\w+)"/g)].map((match) => ({
    name: match[1],
    source: match[2],
  }));
}

const secrets = new Set(
  scriptNames.flatMap((script) =>
    entries(script, "SECRETS").map(({ name }) => name),
  ),
);
const variables = new Set(
  scriptNames.flatMap((script) =>
    entries(script, "VARIABLES").map(({ name }) => name),
  ),
);
const serviceFiles = readdirSync(deployer)
  .flatMap((service) =>
    ["fill_github.yaml", "clear_github.yaml"].map((file) =>
      path.join(deployer, service, file),
    ),
  )
  .filter(existsSync);

function temporary(t) {
  const directory = mkdtempSync(path.join(tmpdir(), "sps-github-settings-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function workflow(name) {
  return YAML.parse(
    readFileSync(path.join(root, ".github/workflows", name), "utf8"),
  );
}

test("credentials and capability URLs never enter the variable lists", () => {
  for (const key of secrets) {
    assert.equal(variables.has(key), false, key);
  }
  for (const key of [
    "DATABASE_PASSWORD",
    "RBAC_JWT_SECRET",
    "GH_TOKEN",
    "ANSIBLE_PRIVATE_KEY_BASE64",
    "TELEGRAM_SERVICE_BOT_TOKEN",
    "LLM_SERVICE_URL",
    "PAYKEEPER_WEBHOOK_SECRET",
  ]) {
    assert.equal(secrets.has(key), true, key);
  }
  for (const file of serviceFiles) {
    const document = YAML.parse(readFileSync(file, "utf8"));
    for (const task of document[0].tasks) {
      for (const item of task.loop || []) {
        if (typeof item !== "object") {
          continue;
        }
        const name = (item.variable_name || item.secret_name).match(
          /~ '([^']+)'/,
        )[1];
        if (item.variable_name) {
          assert.equal(secrets.has(name), false, name);
          assert.doesNotMatch(
            name,
            /PORTAINER_.*UPDATE_URL|PASSWORD|PRIVATE_KEY|ACCESS_KEY/,
          );
          assert.equal(item.secret_scope, undefined);
          variables.add(name);
        }
        if (/PORTAINER_.*UPDATE_URL|AWS_(SECRET_)?ACCESS_KEY/.test(name)) {
          assert.ok(item.secret_name, name);
        }
      }
    }
  }
});

test("all Ansible inputs use the classified store and are written to .env", () => {
  const steps = workflow("ansible.yml").jobs.ansible.steps.filter((step) =>
    step.name.startsWith("Add deployer"),
  );
  for (const step of steps) {
    for (const [key, expression] of Object.entries(step.env)) {
      const [, store, prefixed] = expression.match(
        /^\$\{\{ (secrets|vars)\.(\w+) \}\}$/,
      );
      const name = prefixed.replace(/^PREVIEW_/, "");
      assert.ok(
        (store === "secrets" ? secrets : variables).has(name),
        `${store}.${name}`,
      );
      assert.ok(step.run.includes(`"${key}=$${key}"`), key);
    }
  }
});

test("workflows no longer read moved settings from Secrets", () => {
  for (const file of readdirSync(path.join(root, ".github/workflows"))) {
    const text = readFileSync(
      path.join(root, ".github/workflows", file),
      "utf8",
    );
    for (const [, name] of text.matchAll(/secrets\.(\w+)/g)) {
      assert.equal(
        variables.has(name.replace(/^PREVIEW_/, "")),
        false,
        `${file}: ${name}`,
      );
    }
    for (const [, name] of text.matchAll(/vars\.(\w+)/g)) {
      assert.equal(
        secrets.has(name.replace(/^PREVIEW_/, "")),
        false,
        `${file}: ${name}`,
      );
    }
  }
});

test("service teardown includes every generated Actions variable", () => {
  for (const file of serviceFiles.filter((file) =>
    file.endsWith("fill_github.yaml"),
  )) {
    const fill = YAML.parse(readFileSync(file, "utf8"))[0];
    const clear = YAML.parse(
      readFileSync(file.replace("fill_github", "clear_github"), "utf8"),
    )[0];
    const created = fill.tasks
      .flatMap((task) => task.loop || [])
      .filter((item) => item.variable_name)
      .map((item) => item.variable_name);
    const deleted = clear.tasks
      .flatMap((task) => task.loop || [])
      .filter((item) => item.variable_name)
      .map((item) => item.variable_name);
    for (const name of created) {
      assert.ok(deleted.includes(name), `${file}: ${name}`);
    }
  }
});

function shellFixture(t, configured = true) {
  const directory = temporary(t);
  mkdirSync(path.join(directory, "github/github-node-api"), {
    recursive: true,
  });
  mkdirSync(path.join(directory, "bin"));
  for (const name of [
    ...scriptNames,
    "github.sh",
    "get_env.sh",
    "get_environment_type.sh",
    "github/input.sh",
  ]) {
    copyFileSync(path.join(deployer, name), path.join(directory, name));
  }
  for (const name of scriptNames) {
    // The real wrapper executes these by path.
    spawnSync("chmod", ["+x", path.join(directory, name)]);
  }
  writeFileSync(
    path.join(directory, "create_inventory.sh"),
    "#!/bin/bash\nexit 0\n",
    { mode: 0o700 },
  );
  writeFileSync(path.join(directory, "bin/npm"), "#!/bin/bash\nexit 0\n", {
    mode: 0o700,
  });
  writeFileSync(
    path.join(directory, "bin/node"),
    `#!/usr/bin/env python3
import json, os, sys
data=json.load(sys.stdin)
operation=os.path.basename(sys.argv[1])
if os.environ.get('FAIL_NAME') and data.get('VARIABLE_NAME') == os.environ['FAIL_NAME']:
    sys.exit(1)
with open(os.environ['CALL_LOG'], 'a') as target:
    target.write(json.dumps({'operation':operation,'data':data})+'\\n')
`,
    { mode: 0o700 },
  );
  const values = {
    GITHUB_TOKEN: "fixture-token",
    GITHUB_REPOSITORY: "fixture/project",
  };
  if (configured) {
    for (const script of scriptNames) {
      for (const { source } of [
        ...entries(script, "SECRETS"),
        ...entries(script, "VARIABLES"),
      ]) {
        values[source] = `fixture-${source}`;
      }
    }
    values.DOMAIN = 'example.test-$(touch should-not-exist)-"quoted"';
    values.RBAC_RATE_LIMIT_ENABLED = "false";
    values.NOTIFICATION_SES_MESSAGES_PER_SECOND = "0";
  }
  writeFileSync(
    path.join(directory, ".env"),
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
  );
  const log = path.join(directory, "calls.jsonl");
  const env = {
    ...process.env,
    PATH: `${directory}/bin:${process.env.PATH}`,
    CALL_LOG: log,
  };
  return {
    directory,
    env,
    values,
    calls: () =>
      existsSync(log)
        ? readFileSync(log, "utf8").trim().split("\n").map(JSON.parse)
        : [],
  };
}

for (const prefix of ["", "PREVIEW_"]) {
  test(`github.sh sync and teardown preserve ${prefix || "production"} classification`, (t) => {
    const fixture = shellFixture(t);
    const args = ["github.sh", "up", prefix ? "PREVIEW" : ""];
    const result = spawnSync("bash", args, {
      cwd: fixture.directory,
      env: fixture.env,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const calls = fixture.calls();
    const writes = calls.filter(
      ({ operation }) => operation !== "create_branch.js",
    );
    const configuredCount = scriptNames.reduce(
      (count, script) =>
        count +
        entries(script, "SECRETS").length +
        entries(script, "VARIABLES").length,
      0,
    );
    assert.equal(writes.length, configuredCount);
    for (const { operation, data } of writes) {
      const secret = operation === "create_secret.js";
      const name = data[secret ? "SECRET_NAME" : "VARIABLE_NAME"];
      assert.ok(name.startsWith(prefix));
      assert.ok(
        (secret ? secrets : variables).has(name.slice(prefix.length)),
        name,
      );
    }
    const domain = writes.find(
      ({ data }) => data.VARIABLE_NAME === `${prefix}DOMAIN`,
    );
    assert.equal(domain.data.VARIABLE_CONTENT, fixture.values.DOMAIN);
    assert.equal(
      existsSync(path.join(fixture.directory, "should-not-exist")),
      false,
    );
    for (const [name, value] of [
      ["RBAC_RATE_LIMIT_ENABLED", "false"],
      ["NOTIFICATION_SES_MESSAGES_PER_SECOND", "0"],
    ]) {
      assert.equal(
        writes.find(({ data }) => data.VARIABLE_NAME === `${prefix}${name}`)
          .data.VARIABLE_CONTENT,
        value,
      );
    }
    const before = calls.length;
    const down = spawnSync(
      "bash",
      ["github.sh", "down", prefix ? "PREVIEW" : ""],
      { cwd: fixture.directory, env: fixture.env, encoding: "utf8" },
    );
    assert.equal(down.status, 0, down.stderr);
    const deletes = fixture.calls().slice(before);
    assert.equal(deletes.length, writes.length);
    assert.ok(
      deletes.every(
        ({ operation }) =>
          operation === "delete_secret.js" ||
          operation === "delete_variable.js",
      ),
    );
  });
}

test("absent settings do not upload synthetic defaults", (t) => {
  const fixture = shellFixture(t, false);
  const result = spawnSync("bash", ["github.sh", "up"], {
    cwd: fixture.directory,
    env: fixture.env,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    fixture.calls().some(({ operation }) => operation === "create_variable.js"),
    false,
  );
  const writes = fixture
    .calls()
    .filter(({ operation }) => operation === "create_secret.js");
  assert.deepEqual(
    writes.map(({ data }) => data.SECRET_NAME),
    ["GH_TOKEN"],
  );
  assert.deepEqual(
    fixture
      .calls()
      .filter(({ operation }) => operation === "delete_variable.js")
      .map(({ data }) => data.VARIABLE_NAME),
    ["AWS_S3_BUCKET_NAME", "AWS_S3_DEV_BUCKET_NAME"],
  );
});

test("a failed migration stops synchronization before uploading new secrets", (t) => {
  const fixture = shellFixture(t);
  const result = spawnSync("bash", ["github.sh", "up"], {
    cwd: fixture.directory,
    env: { ...fixture.env, FAIL_NAME: "DOMAIN" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.equal(
    fixture.calls().some(({ operation }) => operation === "create_secret.js"),
    false,
  );
});

for (const preview of [false, true]) {
  test(`Ansible ${preview ? "preview" : "production"} writes mixed stores safely`, (t) => {
    const directory = temporary(t);
    const step = workflow("ansible.yml").jobs.ansible.steps.find(
      (step) =>
        step.name ===
        `Add deployer ${preview ? "PREVIEW" : "production"} settings to env file`,
    );
    const env = { ...process.env, GITHUB_REPOSITORY: "fixture/project" };
    for (const [key, expression] of Object.entries(step.env)) {
      const [, store, name] = expression.match(
        /^\$\{\{ (secrets|vars)\.(\w+) \}\}$/,
      );
      assert.equal(name.startsWith("PREVIEW_"), preview, key);
      env[key] = `${store}-${name}-$(touch should-not-exist)-"quote"`;
    }
    const result = spawnSync("bash", ["-c", step.run], {
      cwd: directory,
      env,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const output = readFileSync(path.join(directory, ".env"), "utf8");
    for (const key of Object.keys(step.env)) {
      assert.ok(output.includes(`${key}=${env[key]}\n`), key);
    }
    assert.equal(statSync(path.join(directory, ".env")).mode & 0o777, 0o600);
    assert.equal(existsSync(path.join(directory, "should-not-exist")), false);
    const invalid = spawnSync("bash", ["-c", step.run], {
      cwd: directory,
      env: { ...env, DOMAIN: "example.test\nINJECTED=value" },
      encoding: "utf8",
    });
    assert.notEqual(invalid.status, 0);
    assert.equal(readFileSync(path.join(directory, ".env"), "utf8"), output);
  });
}

test("Docker build configuration keeps preview separate and omits credentials in verify-only mode", (t) => {
  const directory = temporary(t);
  const step = workflow("docker-image.yml").jobs[
    "build-docker-image"
  ].steps.find(
    (step) => step.name === "Set environment variables based on PRERELEASE",
  );
  for (const [preview, verify] of [
    [false, false],
    [true, false],
    [true, true],
  ]) {
    const output = path.join(directory, `env-${preview}-${verify}`);
    const env = { ...process.env, GITHUB_ENV: output };
    for (const key of Object.keys(step.env)) {
      env[key] = `fixture-${key}-$(touch should-not-exist)`;
    }
    env.PRERELEASE = String(preview);
    env.VERIFY_ONLY = String(verify);
    const result = spawnSync("bash", ["-c", step.run], {
      cwd: directory,
      env,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const settings = readFileSync(output, "utf8");
    if (verify) {
      assert.doesNotMatch(settings, /PASSWORD|DOCKER_HUB/);
    } else {
      const expected = preview
        ? env.PREVIEW_DOCKER_HUB_PASSWORD
        : env.DOCKER_HUB_PASSWORD;
      assert.ok(settings.includes(`DOCKER_HUB_PASSWORD=${expected}\n`));
    }
    assert.equal(existsSync(path.join(directory, "should-not-exist")), false);
  }
});

test(
  "Ansible renders every service GitHub request with the expected store and prefix",
  {
    skip: Boolean(spawnSync("ansible-playbook", ["--version"]).error),
  },
  (t) => {
    const directory = temporary(t);
    const log = path.join(directory, "requests.jsonl");
    const receiver = path.join(directory, "receive.cjs");
    writeFileSync(
      receiver,
      `const fs = require('node:fs');
const data = JSON.parse(fs.readFileSync(0, 'utf8'));
fs.appendFileSync(process.argv[2], JSON.stringify({ operation: process.argv[3], data }) + '\\n');
`,
    );
    const blocks = [];
    let expected = 0;
    for (const file of serviceFiles) {
      const original = YAML.parse(readFileSync(file, "utf8"))[0];
      const values = { ENVIRONMENT_TYPE: "PREVIEW" };
      for (const expression of Object.values(original.vars)) {
        for (const [, name] of expression.matchAll(/\b([A-Z][A-Z0-9_]+)\b/g)) {
          if (name !== "ENVIRONMENT_TYPE") {
            values[name] = `fixture-${name}`;
          }
        }
      }
      const tasks = [];
      for (const task of original.tasks) {
        if (task.set_fact?.ENVIRONMENT_TYPE_PREFIX) {
          tasks.push(task);
        }
        const command = task["ansible.builtin.command"];
        if (!command) {
          continue;
        }
        for (const [, name] of JSON.stringify(task.loop).matchAll(
          /\b(\w+)\.stdout/g,
        )) {
          values[name] = { stdout: `fixture-${name}` };
        }
        expected += task.loop.length;
        tasks.push({
          ...task,
          "ansible.builtin.command": {
            argv: [process.execPath, receiver, log, command.argv[1]],
            stdin: command.stdin,
            chdir: directory,
          },
        });
      }
      blocks.push({
        name: path.relative(deployer, file),
        vars: { ...values, ...original.vars },
        block: tasks,
      });
    }
    const playbook = path.join(directory, "verify.yaml");
    writeFileSync(
      playbook,
      YAML.stringify([
        {
          hosts: "localhost",
          connection: "local",
          gather_facts: false,
          tasks: blocks,
        },
      ]),
    );
    const result = spawnSync(
      "ansible-playbook",
      ["-i", "localhost,", playbook],
      { cwd: directory, encoding: "utf8", timeout: 180000 },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const requests = readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map(JSON.parse);
    assert.equal(requests.length, expected);
    for (const { operation, data } of requests) {
      const variable = operation.includes("variable");
      const name = data[variable ? "VARIABLE_NAME" : "SECRET_NAME"];
      assert.ok(name.startsWith("PREVIEW_"));
      assert.equal(data.GITHUB_TOKEN, "fixture-GITHUB_TOKEN");
      if (variable) {
        assert.equal(secrets.has(name.slice("PREVIEW_".length)), false, name);
        assert.equal(data.SECRET_CONTENT, undefined);
      } else {
        assert.equal(data.VARIABLE_CONTENT, undefined);
      }
    }
  },
);
