import { afterAll, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "yaml";

const deployer = path.resolve(import.meta.dir, "../deployer");
const scratch = mkdtempSync(path.join(os.tmpdir(), "sps-deploy-input-"));
const marker = "test 'quotes' = \`not a command\` $()";
const env = {
  PATH: process.env.PATH,
  HOME: scratch,
  GITHUB_TOKEN: marker,
  SECRET_CONTENT: marker,
  GITHUB_REPOSITORY: "test/fixture",
  SECRET_NAME: "PREVIEW_DATABASE_PASSWORD",
};

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

test("Ansible gets DB and RBAC values from its environment, never argv", () => {
  const result = spawnSync(
    "bash",
    [
      "-c",
      `source ./ansible_vars.sh
     ansible-playbook() {
       [[ "$*" != *"$SECRET_CONTENT"* && "$*" == *DATABASE_PASSWORD* ]] || return 1
       bash -c '[[ "$DATABASE_PASSWORD" = "$SECRET_CONTENT" && "$RBAC_SECRET_KEY" = "$SECRET_CONTENT" ]]'
     }
     DATABASE_PASSWORD="$SECRET_CONTENT"
     RBAC_SECRET_KEY="$SECRET_CONTENT"
     ansible_with_vars ./api/create_api.yaml DATABASE_PASSWORD RBAC_SECRET_KEY`,
    ],
    { cwd: deployer, env },
  );
  expect(result.status).toBe(0);
});

test("the GitHub secret writer gets the original token and content on stdin", () => {
  const file = path.join(scratch, "input");
  const result = spawnSync(
    "bash",
    [
      "-c",
      `source ./github/input.sh
     node() { [[ "$#" = 1 && "$*" != *"$SECRET_CONTENT"* ]] && cat > "$INPUT_FILE"; }
     github_command create_secret SECRET_NAME SECRET_CONTENT`,
    ],
    { cwd: deployer, env: { ...env, INPUT_FILE: file } },
  );
  expect(result.status).toBe(0);
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
    GITHUB_REPOSITORY: "test/fixture",
    GITHUB_TOKEN: marker,
    SECRET_NAME: "PREVIEW_DATABASE_PASSWORD",
    SECRET_CONTENT: marker,
  });
});

interface IWorkflowStep {
  name: string;
  env?: Record<string, string>;
  run?: string;
}

const workflow = parse(
  readFileSync(
    path.resolve(deployer, "../../.github/workflows/ansible.yml"),
    "utf8",
  ),
);
const steps: IWorkflowStep[] = workflow.jobs.ansible.steps;

test.each([
  ["Add deployer PREVIEW secrets to env file", "PREVIEW_"],
  ["Add deployer default secrets to env file", ""],
])("%s writes exactly its declared values", (name, prefix) => {
  const step = steps.find((candidate) => candidate.name === name);
  if (!step?.run || !step.env) {
    throw new Error(`Missing deployer workflow step: ${name}`);
  }
  const variables = Object.keys(step.env);
  expect(step.env.PROJECT_NAME).toBe(`\${{ secrets.${prefix}PROJECT_NAME }}`);
  expect(step.env.DATABASE_BACKUP_RETENTION_DAYS).toBe(
    `\${{ secrets.${prefix}DATABASE_BACKUP_RETENTION_DAYS }}`,
  );
  const values = Object.fromEntries(variables.map((key) => [key, marker]));
  values.GITHUB_REPOSITORY = "test/fixture"; // Built in on the Actions runner.
  writeFileSync(path.join(scratch, "write-env-step.sh"), step.run);
  const run = (password: string) =>
    spawnSync("bash", ["write-env-step.sh"], {
      cwd: scratch,
      env: {
        PATH: process.env.PATH,
        HOME: scratch,
        ...values,
        DATABASE_PASSWORD: password,
      },
    });
  const file = path.join(scratch, ".env");
  writeFileSync(file, "old", { mode: 0o644 });
  expect(run(marker).status).toBe(0);
  expect(statSync(file).mode & 0o777).toBe(0o600);
  const lines = readFileSync(file, "utf8").trimEnd().split("\n").sort();
  expect(lines).toEqual(
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .sort(),
  );
  expect(run("first\nINJECTED=1").status).not.toBe(0);
  expect(readFileSync(file, "utf8").trimEnd().split("\n").sort()).toEqual(
    lines,
  );
});
