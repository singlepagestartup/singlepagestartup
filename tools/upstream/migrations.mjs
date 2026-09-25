import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const lines = (value) => value.trim().split("\n").filter(Boolean);
const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;

/** Parse the final trailer paragraph only; commit prose is never executable. */
export function parseMessage(message) {
  const paragraph =
    message
      .trim()
      .split(/\r?\n\s*\r?\n/)
      .at(-1) ?? "";
  const fields = Object.create(null);
  const errors = [];
  const hasTrailers = paragraph.includes("Downstream-");
  const known = new Set(["Impact", "Reason", "Applies-To", "Action", "Verify"]);
  for (const line of paragraph.split(/\r?\n/)) {
    const match = /^Downstream-([A-Za-z-]+):\s*(.*)$/.exec(line);
    if (!match) {
      if (hasTrailers) errors.push("Each trailer must occupy one line.");
      continue;
    }
    const [, key, value] = match;
    if (!known.has(key)) {
      errors.push(`Unknown trailer: ${key}`);
      continue;
    }
    (fields[key] ??= []).push(value.trim());
    if (!value.trim()) errors.push(`Empty trailer: ${key}`);
  }
  for (const key of ["Impact", "Reason", "Applies-To"]) {
    if ((fields[key]?.length ?? 0) > 1)
      errors.push(`Duplicate trailer: ${key}`);
  }
  const impact = fields.Impact?.[0];
  if (!["required", "none"].includes(impact))
    errors.push("Downstream-Impact must be required or none.");
  if (!fields.Reason?.[0]) errors.push("Downstream-Reason is required.");
  if (impact === "required") {
    for (const key of ["Applies-To", "Action", "Verify"]) {
      if (!fields[key]?.[0])
        errors.push(`Downstream-${key} is required for migration.`);
    }
  } else if (
    impact === "none" &&
    ["Applies-To", "Action", "Verify"].some((key) => fields[key])
  ) {
    errors.push("Migration actions require Downstream-Impact: required.");
  }
  return { impact: errors.length ? "review-required" : impact, fields, errors };
}

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    env: {
      ...process.env,
      GIT_NO_LAZY_FETCH: "1",
      GIT_ALLOW_PROTOCOL: "",
      GIT_TERMINAL_PROMPT: "0",
    },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();
}

function ancestor(cwd, older, newer) {
  try {
    git(cwd, ["merge-base", "--is-ancestor", older, newer]);
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

/** Inspect locally integrated upstream history. Fetching and merging belong to the agent. */
export function check(cwd, { remote = "upstream", ref } = {}) {
  const remotes = lines(git(cwd, ["remote"]));
  if (!remotes.includes(remote)) {
    if (remote === "upstream" && !ref)
      return { status: "not-configured", commits: [] };
    throw new Error(`Remote is not configured: ${remote}`);
  }
  if (git(cwd, ["rev-parse", "--is-shallow-repository"]) === "true")
    throw new Error(
      "Shallow history cannot establish adaptation coverage. Obtain the required history separately, then rerun adapt-upstream.",
    );
  const url = git(cwd, ["remote", "get-url", "--", remote]);
  if (!ref) {
    try {
      ref = git(cwd, ["symbolic-ref", `refs/remotes/${remote}/HEAD`]);
    } catch {
      throw new Error(
        `Remote default branch is unknown. Pass --ref refs/remotes/${remote}/<branch>.`,
      );
    }
  }
  if (!ref.startsWith(`refs/remotes/${remote}/`))
    throw new Error("Use a full remote-tracking ref for the selected remote.");
  git(cwd, ["check-ref-format", ref]);
  const source = git(cwd, [
    "rev-parse",
    "--verify",
    "--end-of-options",
    `${ref}^{commit}`,
  ]);
  const head = git(cwd, ["rev-parse", "--verify", "HEAD"]);
  const identity = digest([url, ref]);
  const statePath = resolve(
    cwd,
    git(cwd, ["rev-parse", "--git-path", `sps-upstream/${identity}.json`]),
  );
  const state = existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, "utf8"))
    : null;
  if (
    state &&
    (state.version !== 1 ||
      !Array.isArray(state.frontiers) ||
      !state.frontiers.length ||
      !/^[a-f0-9]{40,64}$/.test(state.appliedAt) ||
      state.frontiers.some((sha) => !/^[a-f0-9]{40,64}$/.test(sha)))
  ) {
    throw new Error(
      "Invalid upstream checkpoint; inspect it before continuing.",
    );
  }
  let frontiers;
  try {
    frontiers = lines(git(cwd, ["merge-base", "--all", head, source])).sort();
  } catch (error) {
    if (error.status !== 1) throw error;
    throw new Error(
      "No shared history. Review the synchronization range explicitly; no migration is acknowledged.",
    );
  }
  // A checkpoint only applies on descendants containing the adaptation commit.
  const reusable =
    state &&
    ancestor(cwd, state.appliedAt, head) &&
    state.frontiers.every((old) =>
      frontiers.some((tip) => ancestor(cwd, old, tip)),
    );
  const bootstrap = !reusable;
  const revisions = [
    ...frontiers,
    ...(reusable ? ["--not", ...state.frontiers] : []),
  ];
  const history = git(cwd, [
    "log",
    "--reverse",
    "--topo-order",
    "-z",
    "--format=%H%x00%B",
    ...revisions,
    "--",
  ]);
  const parts = history ? history.split("\0") : [];
  if (parts.at(-1) === "") parts.pop();
  const commits = [];
  for (let index = 0; index < parts.length; index += 2) {
    const sha = parts[index];
    const message = parts[index + 1];
    if (!/^[a-f0-9]{40,64}$/.test(sha) || message === undefined)
      throw new Error("Could not parse Git history.");
    commits.push({
      sha,
      subject: message.split("\n")[0],
      message,
      ...parseMessage(message),
    });
  }
  const token = digest([identity, head, source, frontiers, state]);
  return {
    status: commits.length || bootstrap ? "review-required" : "clean",
    remote,
    ref,
    head,
    source,
    frontiers,
    bootstrap,
    sourceAhead: !ancestor(cwd, source, head),
    token,
    statePath,
    commits,
  };
}

/** Save only a Git cursor after the agent has committed and verified every adaptation. */
export function complete(cwd, report) {
  const current = check(cwd, { remote: report.remote, ref: report.ref });
  if (!report.token || current.token !== report.token)
    throw new Error(
      "History changed. Run check again and review the new report.",
    );
  if (current.status !== "review-required")
    throw new Error("There is no pending review to complete.");
  if (git(cwd, ["status", "--porcelain"]))
    throw new Error(
      "Commit the reviewed adaptations first; the working tree must be clean.",
    );
  if (current.bootstrap && !nonempty(report.compatibilityReview))
    throw new Error(
      "Initial or rewritten history requires a current-project compatibility review.",
    );
  const pending = new Set(current.commits.map(({ sha }) => sha));
  const covered = new Set();
  for (const review of report.reviews ?? []) {
    if (
      !["applied", "not-applicable", "already-applied"].includes(
        review.outcome,
      ) ||
      !nonempty(review.reason) ||
      !nonempty(review.verification) ||
      !Array.isArray(review.commits) ||
      !review.commits.length
    ) {
      throw new Error(
        "Each review needs commits, outcome, reason, and verification.",
      );
    }
    for (const sha of review.commits) {
      if (!pending.has(sha) || covered.has(sha))
        throw new Error(`Unknown or duplicate reviewed commit: ${sha}`);
      covered.add(sha);
    }
  }
  if (covered.size !== pending.size)
    throw new Error("Every pending commit needs an applicability decision.");
  const state = {
    version: 1,
    appliedAt: current.head,
    frontiers: current.frontiers,
  };
  mkdirSync(dirname(current.statePath), { recursive: true });
  const temporary = `${current.statePath}.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(state, null, 2) + "\n", {
    flag: "wx",
  });
  renameSync(temporary, current.statePath);
  return { status: "complete", reviewed: covered.size };
}

export function main(args, cwd = process.cwd()) {
  const [command, ...rest] = args;
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    if (
      ["--remote", "--ref", "--report", "--file"].includes(key) &&
      rest[i + 1] &&
      !rest[i + 1].startsWith("--")
    )
      options[key.slice(2)] = rest[++i];
    else throw new Error(`Unknown or incomplete argument: ${key}`);
  }
  if (command === "message") {
    if (!options.file)
      throw new Error("message requires --file <commit-message>.");
    const result = parseMessage(readFileSync(options.file, "utf8"));
    if (result.errors.length) throw new Error(result.errors.join("\n"));
    console.log("Downstream commit instructions: valid");
    return 0;
  }
  if (command === "complete") {
    if (!options.report)
      throw new Error("complete requires --report <reviewed-report.json>.");
    console.log(
      JSON.stringify(
        complete(cwd, JSON.parse(readFileSync(options.report, "utf8"))),
      ),
    );
    return 0;
  }
  if (command !== "check")
    throw new Error(
      "Use check [--remote name] [--ref full-ref] [--report file], message --file file, or complete --report file.",
    );
  const report = check(cwd, options);
  if (options.report)
    writeFileSync(options.report, JSON.stringify(report, null, 2) + "\n");
  const summary = {
    status: report.status,
    bootstrap: report.bootstrap,
    sourceAhead: report.sourceAhead,
    pending: report.commits.length,
    migrations: report.commits.filter(({ impact }) => impact === "required")
      .length,
    legacyOrInvalid: report.commits.filter(
      ({ impact }) => impact === "review-required",
    ).length,
    ...(options.report ? { report: resolve(options.report) } : {}),
  };
  console.log(JSON.stringify(summary, null, 2));
  return report.status === "review-required" ? 2 : 0;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`SPS adapt-upstream: ${error.message}`);
    process.exitCode = 1;
  }
}
