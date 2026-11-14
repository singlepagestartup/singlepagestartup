import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import YAML from "yaml";

const deployer = fileURLToPath(new URL("../", import.meta.url));

function fixture(t) {
  const directory = mkdtempSync(path.join(tmpdir(), "sps-optional-s3-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function readCalls(log) {
  if (!existsSync(log)) {
    return [];
  }
  return readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
}

for (const mode of ["up", "down"]) {
  test(`aws.sh ${mode} only manages explicitly named buckets and preserves SES`, (t) => {
    const directory = fixture(t);
    for (const name of ["aws.sh", "get_env.sh", "get_environment_type.sh"]) {
      copyFileSync(path.join(deployer, name), path.join(directory, name));
    }
    writeFileSync(
      path.join(directory, "create_inventory.sh"),
      "#!/bin/bash\nexit 0\n",
      { mode: 0o700 },
    );
    writeFileSync(
      path.join(directory, "ansible_vars.sh"),
      `ansible_with_vars() {
    printf '%s\\n' "$1" >> "$CALL_LOG"
    if [ "$1" = "$FAIL_PLAYBOOK" ]; then
        return 1
    fi
}
`,
    );
    const log = path.join(directory, "calls");
    for (const [production, development] of [
      ["", ""],
      ["files-prod", ""],
      ["", "files-dev"],
      ["files-prod", "files-dev"],
    ]) {
      writeFileSync(
        path.join(directory, ".env"),
        `PROJECT_NAME=fixture-project\nROOT_AWS_ACCESS_KEY_ID=fixture-key\nAWS_S3_BUCKET_NAME=${production}\nAWS_S3_DEV_BUCKET_NAME=${development}\n`,
      );
      writeFileSync(log, "");
      const result = spawnSync("bash", ["aws.sh", mode], {
        cwd: directory,
        env: { ...process.env, CALL_LOG: log },
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      const calls = readFileSync(log, "utf8").trim().split("\n");
      assert.equal(
        calls.includes(`./aws/${mode === "up" ? "create" : "delete"}_s3.yaml`),
        Boolean(production || development),
      );
      assert.ok(
        calls.includes(
          `./aws/${mode === "up" ? "create" : "delete"}_iam_user.yaml`,
        ),
      );
      assert.ok(
        calls.includes(`./aws/${mode === "up" ? "fill" : "clear"}_github.yaml`),
      );
    }
    const failed = spawnSync("bash", ["aws.sh", mode], {
      cwd: directory,
      env: {
        ...process.env,
        CALL_LOG: log,
        FAIL_PLAYBOOK: `./aws/${mode === "up" ? "create" : "delete"}_s3.yaml`,
      },
      encoding: "utf8",
    });
    assert.notEqual(failed.status, 0);
  });
}

// Run real Ansible conditions, loops, templates, file writes and registers.
// Only cloud modules, package installation and GitHub calls are replaced.
function preparePlaybook(directory, filename, values) {
  const original = YAML.parse(
    readFileSync(path.join(deployer, "aws", filename), "utf8"),
  )[0];
  function tasks(entries) {
    return entries.map((entry) => {
      const task = structuredClone(entry);
      if (task.block) {
        task.block = tasks(task.block);
        return task;
      }
      const cloud = Object.keys(task).find(
        (key) =>
          key.startsWith("amazon.aws.") || key.startsWith("community.aws."),
      );
      if (cloud) {
        task.aws_fixture = {
          operation: cloud,
          arguments: task[cloud],
          log: path.join(directory, "aws.jsonl"),
        };
        delete task[cloud];
      }
      if (task.pip) {
        delete task.pip;
        task.debug = {
          msg: "Package installation is excluded from the local test.",
        };
      }
      for (const module of [
        "stat",
        "copy",
        "file",
        "fetch",
        "ansible.builtin.slurp",
        "ansible.builtin.copy",
      ]) {
        if (task[module]) {
          for (const key of ["path", "dest", "src"]) {
            const value = task[module][key];
            if (value?.startsWith("/home/code/")) {
              task[module][key] = value.replace(
                "/home/code/",
                `${directory}/server/`,
              );
            }
          }
        }
      }
      if (task.fetch) {
        task.fetch.dest = `${directory}/download/`;
      }
      if (
        task["ansible.builtin.copy"]?.dest?.startsWith("{{ playbook_dir }}/")
      ) {
        task["ansible.builtin.copy"].dest = task[
          "ansible.builtin.copy"
        ].dest.replace("{{ playbook_dir }}/", `${directory}/download/`);
      }
      return task;
    });
  }
  return {
    ...original,
    hosts: "localhost",
    connection: "local",
    become: false,
    gather_facts: false,
    vars: { ...values, ...original.vars },
    tasks: tasks(original.tasks),
  };
}

const ansibleAvailable = !spawnSync("ansible-playbook", ["--version"]).error;

test(
  "Ansible provisions SES without S3, then enables named buckets without replacing IAM keys",
  { skip: !ansibleAvailable },
  (t) => {
    const directory = fixture(t);
    mkdirSync(path.join(directory, "library"));
    mkdirSync(path.join(directory, "server"));
    mkdirSync(path.join(directory, "download"));
    for (const name of [
      "single_s3_bucket_policy.j2",
      "single_s3_dev_bucket_policy.j2",
      "ses_policy.j2",
    ]) {
      copyFileSync(
        path.join(deployer, "aws", name),
        path.join(directory, name),
      );
    }
    writeFileSync(
      path.join(directory, "library/aws_fixture.py"),
      `from ansible.module_utils.basic import AnsibleModule
import json

def main():
    module = AnsibleModule(argument_spec=dict(operation=dict(type='str', required=True), arguments=dict(type='dict', required=True), log=dict(type='str', required=True)))
    with open(module.params['log'], 'a') as target:
        target.write(json.dumps(dict(operation=module.params['operation'], arguments=module.params['arguments'])) + '\\n')
    module.exit_json(changed=False, access_key=dict(access_key_id='fixture-key'), secret_access_key='fixture-secret')

if __name__ == '__main__':
    main()
`,
    );
    const values = {
      PROJECT_NAME: "fixture-project",
      ROOT_AWS_ACCESS_KEY_ID: "fixture-root",
      ROOT_AWS_SECRET_ACCESS_KEY: "fixture-root-secret",
      AWS_REGION: "eu-central-1",
    };
    function run(files, production, development) {
      const inputs = {
        ...values,
        AWS_S3_BUCKET_NAME: production,
        AWS_S3_DEV_BUCKET_NAME: development,
      };
      const plays = files.map((file) =>
        preparePlaybook(directory, file, inputs),
      );
      const playbook = path.join(directory, "verify.yaml");
      writeFileSync(playbook, YAML.stringify(plays));
      const before = readCalls(path.join(directory, "aws.jsonl")).length;
      const result = spawnSync(
        "ansible-playbook",
        ["-i", "localhost,", playbook],
        { cwd: directory, encoding: "utf8", timeout: 60000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      return readCalls(path.join(directory, "aws.jsonl")).slice(before);
    }
    const fresh = run(["create_iam_user.yaml", "create_s3.yaml"], "", "");
    assert.equal(
      fresh.filter(({ operation }) => operation.endsWith("iam_access_key"))
        .length,
      2,
    );
    assert.deepEqual(
      fresh
        .filter(({ operation }) => operation.endsWith("iam_policy"))
        .map(({ arguments: args }) => args.policy_name),
      ["ses-policy", "ses-policy-dev"],
    );
    assert.equal(
      fresh.some(({ operation }) => operation.includes("s3")),
      false,
    );
    const key = readFileSync(path.join(directory, "server/iam.env"), "utf8");
    function assertPrivateCredentials() {
      for (const name of ["iam.env", "dev.iam.env"]) {
        const downloaded = path.join(directory, "download", name);
        assert.equal(statSync(downloaded).mode & 0o777, 0o600);
        assert.equal(
          readFileSync(downloaded, "utf8"),
          readFileSync(path.join(directory, "server", name), "utf8"),
        );
      }
    }
    assertPrivateCredentials();

    for (const [production, development] of [
      ["files-prod", ""],
      ["", "files-dev"],
      ["files-prod", "files-dev"],
    ]) {
      // A repeated deployment also tightens permissions on older local copies.
      chmodSync(path.join(directory, "download/iam.env"), 0o644);
      chmodSync(path.join(directory, "download/dev.iam.env"), 0o644);
      const calls = run(
        ["create_iam_user.yaml", "create_s3.yaml"],
        production,
        development,
      );
      assertPrivateCredentials();
      assert.equal(
        calls.some(({ operation }) => operation.endsWith("iam_access_key")),
        false,
      );
      assert.equal(
        readFileSync(path.join(directory, "server/iam.env"), "utf8"),
        key,
      );
      assert.deepEqual(
        calls
          .filter(({ operation }) => operation.endsWith("s3_bucket"))
          .map(({ arguments: args }) => args.name),
        [production, development].filter(Boolean),
      );
      const policies = calls.filter(
        ({ operation, arguments: args }) =>
          operation.endsWith("iam_policy") &&
          args.policy_name.startsWith("single-s3"),
      );
      const resources = policies.map(({ arguments: args }) => {
        const policy =
          typeof args.policy_json === "string"
            ? JSON.parse(args.policy_json)
            : args.policy_json;
        return policy.Statement[0].Resource[0];
      });
      assert.deepEqual(
        resources,
        [production, development]
          .filter(Boolean)
          .map((name) => `arn:aws:s3:::${name}/*`),
      );
      assert.equal(
        calls.filter(({ arguments: args }) =>
          args.policy_name?.startsWith("ses-policy"),
        ).length,
        2,
      );
    }
    // Disabling creation on an existing installation must not delete its data.
    const disabled = run(
      ["create_iam_user.yaml", "create_s3.yaml", "delete_s3.yaml"],
      "",
      "",
    );
    assert.equal(
      disabled.some(({ operation }) => operation.includes("s3")),
      false,
    );
    const deleted = run(["delete_s3.yaml"], "files-prod", "");
    assert.equal(deleted.length, 1);
    assert.equal(deleted[0].arguments.name, "files-prod");
    assert.equal(deleted[0].arguments.force, false);
    assert.equal(
      existsSync(path.join(directory, "server/s3_bucket.env")),
      false,
    );
    assert.equal(
      existsSync(path.join(directory, "server/s3_bucket_dev.env")),
      true,
    );
  },
);

test(
  "GitHub metadata contains only configured S3 names while SES credentials remain available",
  { skip: !ansibleAvailable },
  (t) => {
    const directory = fixture(t);
    const original = YAML.parse(
      readFileSync(path.join(deployer, "aws/fill_github.yaml"), "utf8"),
    )[0];
    const receiver = path.join(directory, "receive.cjs");
    writeFileSync(
      receiver,
      `const fs = require('node:fs'); fs.appendFileSync(process.argv[2], fs.readFileSync(0, 'utf8').trim() + '\\n');`,
    );
    const log = path.join(directory, "github.jsonl");
    const plays = [];
    const cases = [
      ["", ""],
      ["files-prod", ""],
      ["", "files-dev"],
      ["files-prod", "files-dev"],
    ];
    for (const [production, development] of cases) {
      const values = {
        AWS_S3_BUCKET_NAME: production,
        AWS_S3_DEV_BUCKET_NAME: development,
        AWS_REGION: "eu-central-1",
        ENVIRONMENT_TYPE: "PREVIEW",
        GITHUB_TOKEN: "fixture-token",
        GITHUB_REPOSITORY: "fixture/project",
      };
      for (const name of [
        "aws_access_key_id",
        "aws_secret_access_key",
        "dev_aws_access_key_id",
        "dev_aws_secret_access_key",
      ]) {
        values[name] = { stdout: `fixture-${name}` };
      }
      const tasks = original.tasks
        .filter((task) => task.set_fact || task["ansible.builtin.command"])
        .map((task) => {
          if (!task["ansible.builtin.command"]) {
            return task;
          }
          return {
            ...task,
            "ansible.builtin.command": {
              argv: [process.execPath, receiver, log],
              stdin: task["ansible.builtin.command"].stdin,
            },
          };
        });
      plays.push({
        hosts: "localhost",
        connection: "local",
        gather_facts: false,
        vars: { ...values, ...original.vars },
        tasks,
      });
    }
    const playbook = path.join(directory, "verify.yaml");
    writeFileSync(playbook, YAML.stringify(plays));
    const result = spawnSync(
      "ansible-playbook",
      ["-i", "localhost,", playbook],
      { cwd: directory, encoding: "utf8", timeout: 60000 },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const calls = readCalls(log);
    for (const [production, development] of cases) {
      const count = 5 + (production ? 2 : 0) + (development ? 2 : 0);
      const group = calls.splice(0, count);
      assert.equal(
        group.filter(({ SECRET_NAME }) =>
          /AWS_(SECRET_)?ACCESS_KEY/.test(SECRET_NAME),
        ).length,
        4,
      );
      assert.ok(
        group.some(({ SECRET_NAME }) => SECRET_NAME === "PREVIEW_AWS_REGION"),
      );
      const buckets = group.filter(
        ({ VARIABLE_NAME, SECRET_NAME }) =>
          (VARIABLE_NAME || SECRET_NAME) === "PREVIEW_AWS_S3_BUCKET",
      );
      assert.deepEqual(
        buckets.map(
          ({ VARIABLE_CONTENT, SECRET_CONTENT }) =>
            VARIABLE_CONTENT || SECRET_CONTENT,
        ),
        [production, development].filter(Boolean),
      );
      assert.ok(
        group.every(({ VARIABLE_CONTENT, SECRET_CONTENT }) =>
          Boolean(VARIABLE_CONTENT || SECRET_CONTENT),
        ),
      );
    }
    assert.equal(calls.length, 0);
  },
);
