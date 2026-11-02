/**
 * BDD Suite: Bootstrap secret generator
 * Given the bootstrap scripts share one generator in tools/deployer
 * When a secret is drawn from it on a host with or without openssl
 * Then the output is cryptographic hex of the requested length, never a repeat
 *      of an earlier draw, never an output the removed $RANDOM generator could
 *      produce, and never an empty string when no random source is usable
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { isLegacyRandomSecret } from "../../libs/shared/utils/src/lib/secret-strength";

const repositoryRoot = process.cwd();
const generator = path.join(
  repositoryRoot,
  "tools/deployer/generate_secret.sh",
);
const capture = mkdtempSync(path.join(os.tmpdir(), "sps-generate-secret-"));

afterAll(() => {
  rmSync(capture, { recursive: true, force: true });
});

interface IShellResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Runs a bash snippet with the generator sourced. The snippet's output is
 * redirected to files rather than captured through pipes, because bun 1.3.6
 * loses piped child output for a test file that lives in a subdirectory. A
 * snippet that narrows PATH does so inside the shell, so that the restriction
 * reaches the generator without also hiding bash itself.
 */
function runShell(script: string): IShellResult {
  const stdoutPath = path.join(capture, "stdout");
  const stderrPath = path.join(capture, "stderr");

  const result = spawnSync(
    "bash",
    [
      "-c",
      `{\n. "${generator}"\n${script}\n} > "${stdoutPath}" 2> "${stderrPath}"`,
    ],
    {
      cwd: repositoryRoot,
      stdio: "ignore",
    },
  );

  return {
    status: result.status,
    stdout: readFileSync(stdoutPath, "utf8"),
    stderr: readFileSync(stderrPath, "utf8"),
  };
}

function draw(script: string): string[] {
  const result = runShell(script);

  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);

  return result.stdout.trim().split("\n");
}

/** A PATH holding od and tr but no openssl, so the fallback branch is taken. */
function pathWithoutOpenssl(): string {
  const prepared = runShell(
    [
      'BIN="$(mktemp -d)/bin"',
      'mkdir -p "$BIN"',
      'ln -sf "$(command -v od)" "$BIN/od"',
      'ln -sf "$(command -v tr)" "$BIN/tr"',
      'echo "$BIN"',
    ].join("\n"),
  );

  expect(prepared.status).toBe(0);

  return prepared.stdout.trim();
}

describe("generate_secret", () => {
  /**
   * BDD Scenario: The documented default shape
   * Given no byte count is requested
   * When a secret is drawn
   * Then it is 64 lowercase hex characters, the shape the deployer templates document
   */
  test("draws 64 lowercase hex characters by default", () => {
    expect(draw("generate_secret")[0]).toMatch(/^[0-9a-f]{64}$/);
  });

  /**
   * BDD Scenario: A requested byte count
   * Given sixteen bytes are requested
   * When a secret is drawn
   * Then it is 32 lowercase hex characters
   */
  test("draws two hex characters per requested byte", () => {
    expect(draw("generate_secret 16")[0]).toMatch(/^[0-9a-f]{32}$/);
  });

  /**
   * BDD Scenario: Independent draws
   * Given two hundred consecutive draws in one shell
   * When their values are compared
   * Then no value repeats, which fifteen bits of entropy could not sustain
   */
  test("never repeats a value across two hundred draws", () => {
    const values = draw(
      "i=0; while [ $i -lt 200 ]; do generate_secret 32; i=$((i+1)); done",
    );

    expect(values).toHaveLength(200);
    expect(new Set(values).size).toBe(200);
  });

  /**
   * BDD Scenario: The removed generator's output set is unreachable
   * Given draws of the same length the removed $RANDOM generator produced
   * When each one is tested against that generator's complete output set
   * Then none is a member of it
   */
  test("never draws a value the removed generator could produce", () => {
    const values = draw(
      "i=0; while [ $i -lt 200 ]; do generate_secret 16; i=$((i+1)); done",
    );

    for (const value of values) {
      expect(value).toMatch(/^[0-9a-f]{32}$/);
      expect(isLegacyRandomSecret(value)).toBe(false);
    }
  });

  /**
   * BDD Scenario: A host without openssl
   * Given a PATH that offers od and tr but no openssl
   * When two hundred secrets are drawn
   * Then the /dev/urandom branch produces the same shape and no repeats
   */
  test("falls back to /dev/urandom when openssl is absent", () => {
    const values = draw(
      `PATH="${pathWithoutOpenssl()}"\n` +
        'if command -v openssl >/dev/null 2>&1; then echo "openssl is still reachable" >&2; exit 1; fi\n' +
        "i=0; while [ $i -lt 200 ]; do generate_secret 32; i=$((i+1)); done",
    );

    expect(values).toHaveLength(200);
    expect(new Set(values).size).toBe(200);

    for (const value of values) {
      expect(value).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  /**
   * BDD Scenario: A host with no usable random source
   * Given a PATH that offers neither openssl nor the tools the fallback needs
   * When a secret is drawn
   * Then nothing is printed, the failure is explained on stderr, and the exit
   *      status is non-zero so a caller cannot write an empty secret
   */
  test("fails loudly instead of printing an empty secret", () => {
    const result = runShell('PATH=""\ngenerate_secret 32');

    expect(result.stdout.trim()).toBe("");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("no cryptographic random source");
  });

  /**
   * BDD Scenario: A caller cannot continue past a failure
   * Given the call form the bootstrap scripts use
   * When no random source is usable
   * Then the caller exits instead of writing the key with an empty value
   */
  test("aborts the calling script rather than writing an empty value", () => {
    const result = runShell(
      'PATH=""\nSECRET=$(generate_secret 32) || { echo "aborted"; exit 3; }\necho "WROTE=$SECRET"',
    );

    expect(result.stdout).toContain("aborted");
    expect(result.stdout).not.toContain("WROTE=");
    expect(result.status).toBe(3);
  });
});

describe("generate_random_string", () => {
  /**
   * BDD Scenario: The deprecated name keeps working
   * Given a project script that still calls the old function name
   * When it draws a secret
   * Then it silently receives the strong value, now 64 characters rather than 32
   */
  test("delegates to the strong generator", () => {
    expect(draw("generate_random_string")[0]).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("bootstrap scripts", () => {
  /**
   * BDD Scenario: The removed source cannot come back
   * Given every create_env.sh tracked in the repository
   * When they are searched for the shell $RANDOM variable
   * Then none of them uses it
   */
  test("no create_env.sh draws from the shell RANDOM variable", () => {
    const scripts = runShell("git ls-files '*create_env.sh'");

    expect(scripts.status).toBe(0);

    const paths = scripts.stdout.trim().split("\n").filter(Boolean);

    expect(paths.length).toBeGreaterThan(0);

    for (const file of paths) {
      expect(
        readFileSync(path.join(repositoryRoot, file), "utf8"),
      ).not.toContain("$RANDOM");
    }
  });
});
