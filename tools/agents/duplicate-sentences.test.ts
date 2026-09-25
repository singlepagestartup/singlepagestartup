/**
 * BDD Suite: One home per instruction sentence
 * Given the agent instruction corpus is loaded per invocation
 * When the same rule is written in two documents
 * Then the check names it, while deliberately mirrored files stay silent
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { findDuplicateSentences } from "./duplicate-sentences";

const RULE =
  "Record the confirmed scope in the owning source and never answer an operator fact with an assumption.";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function corpus(files: Record<string, string>) {
  const root = await mkdtemp(path.join(os.tmpdir(), "sps-duplicate-"));
  roots.push(root);
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  return root;
}

describe("duplicate agent instructions", () => {
  /**
   * BDD Scenario: Two documents claim the same rule
   * Given a contract and a role that state one rule in the same words
   * When the corpus is checked
   * Then the sentence is reported with both files
   */
  test("names a rule written in two documents", async () => {
    const root = await corpus({
      ".agents/contracts/scope.md": `# Scope\n\n${RULE}\n`,
      ".agents/roles/account-manager.md": `# Account Manager\n\n${RULE}\n`,
    });
    const found = await findDuplicateSentences(root);
    expect(found).toHaveLength(1);
    expect(found[0].files).toEqual([
      ".agents/contracts/scope.md",
      ".agents/roles/account-manager.md",
    ]);
    expect(found[0].known).toBe(false);
  });

  /**
   * BDD Scenario: The two entry files are one entry point
   * Given CLAUDE.md and AGENTS.md must stay in sync by repository rule
   * When they carry the same sentence and nothing else does
   * Then the check stays silent
   */
  test("treats the mirrored entry files as one home", async () => {
    const root = await corpus({
      "CLAUDE.md": `# Claude\n\n${RULE}\n`,
      "AGENTS.md": `# Agents\n\n${RULE}\n`,
    });
    expect(await findDuplicateSentences(root)).toEqual([]);
  });

  /**
   * BDD Scenario: Provider adapters repeat a fixed template
   * Given every Claude command and Codex skill points at its canonical workflow
   * When they share that instruction
   * Then the adapter layer counts as one home
   */
  test("treats the provider adapters as one home", async () => {
    const root = await corpus({
      ".claude/commands/debug.md": `# Debug\n\n${RULE}\n`,
      ".codex/skills/debug/SKILL.md": `# Debug\n\n${RULE}\n`,
    });
    expect(await findDuplicateSentences(root)).toEqual([]);
  });

  /**
   * BDD Scenario: Structure is not a rule
   * Given headings, table rows, code and short lines recur everywhere
   * When two documents share them
   * Then none of them is reported
   */
  test("ignores headings, tables, code and short lines", async () => {
    const shared = [
      "## Method",
      "",
      "| State | Meaning |",
      "| ----- | ------- |",
      "",
      "```bash",
      "npm run studio:validate --active-layer singlepage --self-check",
      "```",
      "",
      "Keep it short.",
      "",
    ].join("\n");
    const root = await corpus({
      ".agents/contracts/one.md": shared,
      ".agents/contracts/two.md": shared,
    });
    expect(await findDuplicateSentences(root)).toEqual([]);
  });

  /**
   * BDD Scenario: The editorial pointer belongs in every document
   * Given each role and workflow is loaded on its own
   * When they all point at the shared editorial contract
   * Then the allowed rule keeps them out of the report
   */
  test("allows the editorial contract pointer everywhere", async () => {
    const pointer =
      "Apply `.agents/contracts/editorial-pass.md` before returning or storing prose intended for a person.";
    const root = await corpus({
      ".agents/roles/one.md": `# One\n\n${pointer}\n`,
      ".agents/roles/two.md": `# Two\n\n${pointer}\n`,
    });
    expect(await findDuplicateSentences(root)).toEqual([]);
  });
});
