/**
 * BDD Suite: Preserve and reconcile downstream migration instructions.
 * Given independent Git histories and project-owned adaptations
 * When commits are inspected and a reviewed integration is acknowledged
 * Then missing context stays pending and checkpoints cannot hide unapplied work.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { check, complete, parseMessage } from "./migrations.mjs";

const helper = resolve("tools/upstream/migrations.mjs");
const none =
  "Update shared defaults\n\nDownstream-Impact: none\nDownstream-Reason: Inherited defaults update directly and no owned override uses this field.";
const required =
  "Retire a register\n\nDownstream-Impact: required\nDownstream-Reason: References lose their meaning after retirement.\nDownstream-Applies-To: Owned documents referencing the register.\nDownstream-Action: Recover short descriptions from the child's Git history.\nDownstream-Action: Remove obsolete bindings after adapting consumers.\nDownstream-Verify: Validate resolved documents and inspect references.";

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "sps-upstream-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, "init", "-b", "main");
  git(cwd, "config", "user.email", "test@example.invalid");
  git(cwd, "config", "user.name", "Migration Test");
  git(cwd, "config", "core.hooksPath", "/dev/null");
  const commit = (message, name = "owned.md", body = message) => {
    writeFileSync(join(cwd, name), body);
    git(cwd, "add", "--", name);
    git(cwd, "commit", "-m", message);
    return git(cwd, "rev-parse", "HEAD");
  };
  const base = commit("Legacy initial structure");
  git(
    cwd,
    "remote",
    "add",
    "upstream",
    "https://example.invalid/framework.git",
  );
  const publish = (sha = "HEAD") =>
    git(
      cwd,
      "update-ref",
      "refs/remotes/upstream/main",
      git(cwd, "rev-parse", sha),
    );
  publish();
  git(
    cwd,
    "symbolic-ref",
    "refs/remotes/upstream/HEAD",
    "refs/remotes/upstream/main",
  );
  return { cwd, base, commit, publish };
}

function reviewed(report) {
  return {
    ...report,
    compatibilityReview:
      "Inspected current owned documents and bindings against the new contracts; no dangling references remain.",
    reviews: report.commits.length
      ? [
          {
            commits: report.commits.map(({ sha }) => sha),
            outcome: "already-applied",
            reason:
              "The fixture's owned file already contains the intended current content.",
            verification:
              "Compared the committed owned document and current shared contract.",
          },
        ]
      : [],
  };
}

/** BDD Scenario: Given migration trailers, when parsed, then mandatory context and repeated actions survive. */
test("accepts complete migration instructions and explained no-impact decisions", () => {
  assert.equal(parseMessage(required).impact, "required");
  assert.equal(parseMessage(required).fields.Action.length, 2);
  assert.equal(parseMessage(none).impact, "none");
  assert.equal(
    parseMessage(required.replaceAll("\n", "\r\n")).impact,
    "required",
  );
});

/** BDD Scenario: Given incomplete or ambiguous instructions, when inspected, then they cannot mean no migration. */
test("rejects missing, empty, duplicated, unknown, contradictory, and misplaced trailers", () => {
  for (const message of [
    "Old commit",
    required.replace("Downstream-Verify:", "Check:"),
    required.replace("required\n", "maybe\n"),
    required + "\nDownstream-Impact: none",
    required + "\nDownstream-Unknown: yes",
    required + "\nDownstream-constructor: invalid inherited object key",
    required.replace(/Downstream-Reason:[^\n]+/, "Downstream-Reason:"),
    none + "\nDownstream-Action: Change owned documents.",
    required + "\n\nUnrelated paragraph",
  ])
    assert.equal(parseMessage(message).impact, "review-required", message);
});

/** BDD Scenario: Given old integrated history, when checking repeatedly, then it stays pending until reviewed. */
test("requires a compatibility audit for initial legacy history without auto-acknowledgment", (t) => {
  const { cwd, base } = fixture(t);
  const first = check(cwd);
  assert.equal(first.bootstrap, true);
  assert.equal(first.commits[0].sha, base);
  assert.equal(first.commits[0].impact, "review-required");
  assert.equal(check(cwd).token, first.token);
  assert.equal(existsSync(first.statePath), false);
  assert.throws(
    () => complete(cwd, { ...reviewed(first), compatibilityReview: "" }),
    /compatibility/,
  );
  complete(cwd, reviewed(first));
  assert.equal(check(cwd).status, "clean");
  const state = JSON.parse(readFileSync(first.statePath));
  assert.deepEqual(Object.keys(state).sort(), [
    "appliedAt",
    "frontiers",
    "version",
  ]);
});

/** BDD Scenario: Given fetched but unmerged changes, when inspecting, then only integrated ancestors are reviewable. */
test("finds source commit instructions through a merge without acknowledging fetched-only updates", (t) => {
  const { cwd, commit, publish } = fixture(t);
  complete(cwd, reviewed(check(cwd)));
  git(cwd, "checkout", "-b", "source");
  const migration = commit(required, "shared.md");
  publish();
  git(cwd, "checkout", "main");
  assert.equal(check(cwd).sourceAhead, true);
  assert.equal(check(cwd).status, "clean");
  commit("Child's private document", "child.md");
  git(cwd, "merge", "--no-ff", "source", "-m", "Merge source");
  const report = check(cwd);
  assert.equal(report.sourceAhead, false);
  assert.deepEqual(
    report.commits.map(({ sha }) => sha),
    [migration],
  );
  assert.equal(report.commits[0].impact, "required");
  assert.equal(report.commits[0].message.trim(), required);
});

/** BDD Scenario: Given adaptation pending, when an incomplete or stale report is submitted, then nothing is acknowledged. */
test("rejects incomplete reviews, duplicates, stale tokens, and uncommitted adaptations", (t) => {
  const { cwd, commit, publish } = fixture(t);
  commit(required);
  publish();
  const report = check(cwd);
  assert.throws(
    () => complete(cwd, { ...reviewed(report), reviews: [] }),
    /Every pending/,
  );
  const duplicate = reviewed(report);
  duplicate.reviews.push(duplicate.reviews[0]);
  assert.throws(() => complete(cwd, duplicate), /duplicate/);
  const unverified = reviewed(report);
  unverified.reviews[0].verification = " ";
  assert.throws(() => complete(cwd, unverified), /verification/);
  writeFileSync(join(cwd, "owned.md"), "Uncommitted adaptation");
  assert.throws(() => complete(cwd, reviewed(report)), /working tree/);
  commit("Adapt the child", "owned.md");
  assert.throws(() => complete(cwd, reviewed(report)), /History changed/);
  assert.equal(existsSync(report.statePath), false);
  complete(cwd, reviewed(check(cwd)));
  assert.equal(check(cwd).status, "clean");
});

/** BDD Scenario: Given a checkpoint from another adaptation branch, when switching branches, then missing adaptations are reviewed again. */
test("does not reuse an adaptation checkpoint on a branch that lacks its commit", (t) => {
  const { cwd, commit, publish } = fixture(t);
  commit(required);
  publish();
  git(cwd, "branch", "unadapted");
  commit("Adapt the owned override", "child.md");
  complete(cwd, reviewed(check(cwd)));
  git(cwd, "checkout", "unadapted");
  assert.equal(check(cwd).bootstrap, true);
  assert.equal(check(cwd).status, "review-required");
});

/** BDD Scenario: Given multiple worktrees, when one is acknowledged, then the other retains its own pending review. */
test("keeps checkpoint state local to the worktree", (t) => {
  const { cwd } = fixture(t);
  const worktree = join(cwd, "linked");
  git(cwd, "worktree", "add", "--detach", worktree, "HEAD");
  const main = check(cwd);
  const linked = check(worktree);
  assert.notEqual(main.statePath, linked.statePath);
  complete(worktree, reviewed(linked));
  assert.equal(check(worktree).status, "clean");
  assert.equal(check(cwd).status, "review-required");
});

/** BDD Scenario: Given missing or ambiguous source configuration, when checking, then the helper never guesses a branch. */
test("handles no source, explicit branch selection, invalid refs, and unrelated histories", (t) => {
  const { cwd } = fixture(t);
  git(cwd, "symbolic-ref", "--delete", "refs/remotes/upstream/HEAD");
  assert.throws(() => check(cwd), /default branch is unknown/);
  assert.equal(
    check(cwd, { ref: "refs/remotes/upstream/main" }).status,
    "review-required",
  );
  assert.throws(
    () => check(cwd, { ref: "--upload-pack=evil" }),
    /full remote-tracking ref/,
  );
  assert.throws(() => check(cwd, { remote: "missing" }), /not configured/);
  git(cwd, "checkout", "--orphan", "unrelated");
  git(cwd, "commit", "--allow-empty", "-m", "Different project");
  assert.throws(
    () => check(cwd, { ref: "refs/remotes/upstream/main" }),
    /No shared history/,
  );
  git(cwd, "remote", "remove", "upstream");
  assert.equal(check(cwd).status, "not-configured");
});

/** BDD Scenario: Given source history rewrite, when checking, then the old frontier cannot mask new instructions. */
test("restarts compatibility review after upstream history diverges", (t) => {
  const { cwd, base, commit, publish } = fixture(t);
  commit(none);
  publish();
  complete(cwd, reviewed(check(cwd)));
  git(cwd, "checkout", "-b", "rewritten", base);
  const replacement = commit(required, "replacement.md");
  publish();
  git(cwd, "checkout", "main");
  git(cwd, "merge", "rewritten", "-m", "Integrate replacement");
  const report = check(cwd);
  assert.equal(report.bootstrap, true);
  assert.ok(report.commits.some(({ sha }) => sha === replacement));
});

/** BDD Scenario: Given command-like commit text, when producing a report, then it remains inert text with a pending exit code. */
test("CLI reports pending work and never executes commands from messages", (t) => {
  const { cwd, commit, publish } = fixture(t);
  const marker = join(cwd, "executed");
  const malicious =
    required +
    `\nDownstream-Action: $(touch '${marker}'); node -e 'process.exit(99)'`;
  commit(malicious);
  publish();
  const reportPath = join(tmpdir(), `upstream-review-${Date.now()}.json`);
  t.after(() => rmSync(reportPath, { force: true }));
  const result = spawnSync(
    process.execPath,
    [helper, "check", "--report", reportPath],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 2, result.stderr);
  assert.equal(JSON.parse(result.stdout).pending, 2);
  assert.ok(
    JSON.parse(readFileSync(reportPath)).commits.some(({ message }) =>
      message.includes("$(touch"),
    ),
  );
  assert.equal(existsSync(marker), false);
});

/**
 * BDD Scenario: Adaptation is independent from remote availability.
 * Given an integrated local history with all Git transports disabled
 * When adaptation is explicitly checked and local history later becomes shallow
 * Then local review succeeds without synchronization and incomplete coverage stays pending.
 */
test("checks local history offline and leaves shallow-history review unresolved", (t) => {
  const { cwd, base, commit, publish } = fixture(t);
  commit(required, "shared.md");
  publish();
  const head = git(cwd, "rev-parse", "HEAD");
  const status = git(cwd, "status", "--porcelain");
  const run = () =>
    spawnSync(process.execPath, [helper, "check"], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, GIT_ALLOW_PROTOCOL: "", GIT_TERMINAL_PROMPT: "0" },
    });
  const offline = run();
  assert.equal(offline.status, 2, offline.stderr);
  assert.equal(JSON.parse(offline.stdout).migrations, 1);
  assert.equal(git(cwd, "rev-parse", "HEAD"), head);
  assert.equal(git(cwd, "status", "--porcelain"), status);
  const statePath = check(cwd).statePath;
  writeFileSync(join(cwd, ".git", "shallow"), base + "\n");
  const incomplete = run();
  assert.equal(incomplete.status, 1);
  assert.match(incomplete.stderr, /Shallow history/);
  assert.equal(existsSync(statePath), false);
  assert.equal(git(cwd, "rev-parse", "HEAD"), head);
});

/** BDD Scenario: Given a merged source PR after a completed review, when checking, then all new parents and merge resolutions remain visible. */
test("checks only the new source range while preserving merge commits and their parent instructions", (t) => {
  const { cwd, commit, publish } = fixture(t);
  complete(cwd, reviewed(check(cwd)));
  git(cwd, "checkout", "-b", "feature");
  const feature = commit(required, "feature.md");
  git(cwd, "checkout", "main");
  const main = commit(none, "defaults.md");
  git(
    cwd,
    "merge",
    "--no-ff",
    "feature",
    "-m",
    "Merge a shared change with a manual resolution",
  );
  const merge = git(cwd, "rev-parse", "HEAD");
  publish();
  const report = check(cwd);
  assert.equal(report.bootstrap, false);
  assert.deepEqual(
    new Set(report.commits.map(({ sha }) => sha)),
    new Set([feature, main, merge]),
  );
  assert.equal(
    report.commits.find(({ sha }) => sha === merge).impact,
    "review-required",
  );
  const stale = reviewed(report);
  git(cwd, "checkout", "-b", "future");
  commit(none, "future.md");
  publish();
  git(cwd, "checkout", "main");
  assert.throws(() => complete(cwd, stale), /History changed/);
  complete(cwd, reviewed(check(cwd)));
  assert.equal(check(cwd).status, "clean");
  assert.equal(check(cwd).sourceAhead, true);
});

/** BDD Scenario: Given a saved commit message and a completed project review, when using the CLI, then invalid messages fail and valid reviews clear pending work. */
test("validates literal message files and completes an explicit CLI review", (t) => {
  const { cwd } = fixture(t);
  const temporary = mkdtempSync(join(tmpdir(), "upstream-cli-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const message = join(temporary, "message with spaces.txt");
  writeFileSync(message, "Missing instructions");
  const run = (...args) =>
    spawnSync(process.execPath, [helper, ...args], { cwd, encoding: "utf8" });
  assert.equal(run("message", "--file", message).status, 1);
  writeFileSync(message, required);
  assert.equal(run("message", "--file", message).status, 0);
  const report = join(temporary, "review.json");
  assert.equal(run("check", "--report", report).status, 2);
  writeFileSync(
    report,
    JSON.stringify(reviewed(JSON.parse(readFileSync(report)))),
  );
  const result = run("complete", "--report", report);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(run("check").stdout).status, "clean");
});
