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

const deployer = path.resolve("tools/deployer");
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
      `source "$1/ansible_vars.sh"
     ansible-playbook() {
       [[ "$*" != *"$SECRET_CONTENT"* && "$*" == *DATABASE_PASSWORD* ]] || return 1
       bash -c '[[ "$DATABASE_PASSWORD" = "$SECRET_CONTENT" && "$RBAC_SECRET_KEY" = "$SECRET_CONTENT" ]]'
     }
     DATABASE_PASSWORD="$SECRET_CONTENT"
     RBAC_SECRET_KEY="$SECRET_CONTENT"
     ansible_with_vars ./api/create_api.yaml DATABASE_PASSWORD RBAC_SECRET_KEY`,
      "bash",
      deployer,
    ],
    { env },
  );
  expect(result.status).toBe(0);
});

test("the GitHub secret writer gets the original token and content on stdin", () => {
  const file = path.join(scratch, "input");
  const result = spawnSync(
    "bash",
    [
      "-c",
      `source "$1/github/input.sh"
     node() { [[ "$#" = 1 && "$*" != *"$SECRET_CONTENT"* ]] && cat > "$INPUT_FILE"; }
     github_command create_secret SECRET_NAME SECRET_CONTENT`,
      "bash",
      deployer,
    ],
    { env: { ...env, INPUT_FILE: file } },
  );
  expect(result.status).toBe(0);
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
    GITHUB_REPOSITORY: "test/fixture",
    GITHUB_TOKEN: marker,
    SECRET_NAME: "PREVIEW_DATABASE_PASSWORD",
    SECRET_CONTENT: marker,
  });
});

test("Actions writes only declared variables and refuses embedded .env lines", () => {
  const file = path.join(scratch, ".env");
  const run = (password: string) =>
    spawnSync("bash", [path.join(deployer, "write_actions_env.sh")], {
      cwd: scratch,
      env: { ...env, SPS_DEPLOY_DATABASE_PASSWORD: password },
    });
  writeFileSync(file, "old", { mode: 0o644 });
  expect(run(marker).status).toBe(0);
  expect(statSync(file).mode & 0o777).toBe(0o600);
  expect(run("first\nINJECTED=1").status).not.toBe(0);
  expect(readFileSync(file, "utf8")).toBe(`DATABASE_PASSWORD=${marker}\n`);
});
