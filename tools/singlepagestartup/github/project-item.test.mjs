/**
 * BDD Suite: GitHub Project issue lookup
 * Given a newly created issue absent from the Project list
 * When workflow helpers read its membership and status
 * Then they use the exact issue's unarchived membership in the configured Project
 * and reject duplicate, mismatched, or unverifiable memberships.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const issueUrl = "https://github.com/example/framework/issues/376";

function membership(overrides = {}) {
  return {
    id: "PVTI_expected",
    isArchived: false,
    project: {
      number: 2,
      owner: { __typename: "Organization", login: "example" },
    },
    fieldValueByName: { name: "Research Needed" },
    ...overrides,
  };
}

function page(nodes, hasNextPage = false, endCursor = null) {
  return {
    data: {
      repository: {
        issue: {
          url: issueUrl,
          number: 376,
          projectItems: { nodes, pageInfo: { hasNextPage, endCursor } },
        },
      },
    },
  };
}

function lookup({
  items = [],
  pages = [page([membership()])],
  status = false,
  projectType = "organization",
  artifact,
} = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "sps-project-lookup-"));
  try {
    const helpers = path.join(directory, ".claude/helpers");
    mkdirSync(helpers, { recursive: true });
    for (const file of [
      "get_issue_status.sh",
      "get_project_item_id.sh",
      "validate_project_context.sh",
    ]) {
      copyFileSync(
        path.join(repositoryRoot, ".claude/helpers", file),
        path.join(helpers, file),
      );
    }
    writeFileSync(
      path.join(helpers, "load_config.sh"),
      `
export TARGET_REPO_FULL_NAME=example/framework TARGET_REPO_OWNER=example TARGET_REPO_NAME=framework
export GITHUB_OWNER=example GITHUB_PROJECT_NUMBER=2 GITHUB_PROJECT_OWNER_TYPE=${projectType} GITHUB_PROJECT_CLI_OWNER=example
    gh_retry() { node "$PWD/mock-gh.mjs" "$@"; }
`,
    );
    writeFileSync(
      path.join(directory, "responses.json"),
      JSON.stringify({ items, pages }),
    );
    writeFileSync(path.join(directory, "calls.json"), "[]");
    writeFileSync(
      path.join(directory, "mock-gh.mjs"),
      `
import { readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
const calls = JSON.parse(readFileSync("calls.json"));
calls.push(args);
writeFileSync("calls.json", JSON.stringify(calls));
const responses = JSON.parse(readFileSync("responses.json"));
if (args[0] === "project" && args[1] === "item-list") {
  console.log(JSON.stringify({ items: responses.items }));
} else if (args[0] === "api" && args[1] === "graphql") {
  const index = calls.filter(call => call[0] === "api").length - 1;
  const page = responses.pages[index];
  if (page === undefined) process.exit(9);
  console.log(typeof page === "string" ? page : JSON.stringify(page));
} else { process.exit(9); }
`,
    );
    if (artifact) {
      const processes = path.join(
        directory,
        "thoughts/shared/processes/framework",
      );
      mkdirSync(processes, { recursive: true });
      writeFileSync(path.join(processes, "ISSUE-376.md"), artifact);
    }
    const result = spawnSync(
      "bash",
      [
        path.join(
          helpers,
          status ? "get_issue_status.sh" : "get_project_item_id.sh",
        ),
        "376",
      ],
      { cwd: directory, encoding: "utf8" },
    );
    return {
      ...result,
      calls: JSON.parse(readFileSync(path.join(directory, "calls.json"))),
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function listedItem(overrides = {}) {
  return {
    id: "PVTI_listed",
    repository: "https://github.com/example/framework",
    content: { type: "Issue", number: 376, url: issueUrl },
    status: "Plan in Progress",
    ...overrides,
  };
}

test("preserves ID and status lookup from the Project list without fallback", () => {
  for (const status of [false, true]) {
    const result = lookup({ items: [listedItem()], status });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      result.stdout.trim(),
      status ? "Plan in Progress" : "PVTI_listed",
    );
    assert.equal(result.calls.length, 1);
  }
});

test("recovers the newly created issue and status through direct membership", () => {
  for (const status of [false, true]) {
    const result = lookup({ status });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      result.stdout.trim(),
      status ? "Research Needed" : "PVTI_expected",
    );
    assert.deepEqual(result.calls[1].slice(-6), [
      "-f",
      "owner=example",
      "-f",
      "repo=framework",
      "-F",
      "issue=376",
    ]);
  }
});

test("ignores the same issue number from another repository in the list", () => {
  const result = lookup({
    items: [
      listedItem({
        repository: "https://github.com/other/framework",
        content: {
          type: "Issue",
          number: 376,
          url: "https://github.com/other/framework/issues/376",
        },
      }),
    ],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "PVTI_expected");
  assert.equal(result.calls.length, 2);
});

test("rejects archived, wrong owner, wrong owner type, and wrong Project memberships", () => {
  const mismatches = [
    membership({ isArchived: true }),
    membership({
      project: {
        number: 3,
        owner: { __typename: "Organization", login: "example" },
      },
    }),
    membership({
      project: {
        number: 2,
        owner: { __typename: "Organization", login: "other" },
      },
    }),
    membership({
      project: { number: 2, owner: { __typename: "User", login: "example" } },
    }),
  ];
  for (const item of mismatches) {
    const result = lookup({ pages: [page([item])] });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not found/);
    assert.equal(result.stdout, "");
  }
});

test("supports user-owned Projects and unset status", () => {
  const result = lookup({
    projectType: "user",
    status: true,
    pages: [
      page([
        membership({
          project: {
            number: 2,
            owner: { __typename: "User", login: "example" },
          },
          fieldValueByName: null,
        }),
      ]),
    ],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "");
});

test("rejects duplicate matches in either response", () => {
  for (const options of [
    { items: [listedItem(), listedItem({ id: "PVTI_duplicate" })] },
    { pages: [page([membership(), membership({ id: "PVTI_duplicate" })])] },
  ]) {
    const result = lookup(options);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Multiple Project items/);
  }
});

test("paginates exact issue memberships and rejects duplicates across pages", () => {
  const result = lookup({
    pages: [page([], true, "cursor1"), page([membership()])],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "PVTI_expected");
  assert.deepEqual(result.calls[2].slice(-2), ["-f", "after=cursor1"]);
  const duplicate = lookup({
    pages: [
      page([membership()], true, "cursor1"),
      page([membership({ id: "PVTI_duplicate" })]),
    ],
  });
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /Multiple Project items/);
});

test("rejects missing or non-advancing pagination cursor", () => {
  for (const pages of [
    [page([], true)],
    [page([], true, "cursor1"), page([], true, "cursor1")],
  ]) {
    const result = lookup({ pages });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Could not paginate/);
  }
});

test("fails closed for unavailable, partial, wrong-issue, or malformed responses", () => {
  const wrongIssue = page([membership()]);
  wrongIssue.data.repository.issue.url =
    "https://github.com/other/framework/issues/376";
  for (const response of [
    "",
    "not json",
    { data: { repository: { issue: null } } },
    { ...page([membership()]), errors: [{ message: "denied" }] },
    wrongIssue,
    page([membership({ id: null })]),
  ]) {
    const result = lookup({ pages: [response] });
    assert.notEqual(result.status, 0, JSON.stringify(response));
    assert.equal(result.stdout, "");
  }
});

test("validates local Project artifact context before either lookup", () => {
  for (const status of [false, true]) {
    const result = lookup({
      status,
      artifact: "- Project: `other`, organization Project #3.\n",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Refusing to use a mismatched Project/);
    assert.equal(result.calls.length, 0);
  }
});
