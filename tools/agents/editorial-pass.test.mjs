/**
 * BDD Suite: Agent editorial pass coverage
 * Given the canonical SPS roles, workflows, provider adapters, and Codex skills
 * When the agent-system contract is validated
 * Then every human-facing output path requires the shared final editorial pass
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repository = process.cwd();
const contractPath = ".agents/contracts/editorial-pass.md";

function filesUnder(directory, extension) {
  const result = [];
  for (const entry of readdirSync(join(repository, directory))) {
    const relative = join(directory, entry);
    const absolute = join(repository, relative);
    if (statSync(absolute).isDirectory()) {
      result.push(...filesUnder(relative, extension));
    } else if (relative.endsWith(extension)) {
      result.push(relative);
    }
  }
  return result.sort();
}

function source(path) {
  return readFileSync(join(repository, path), "utf8");
}

/**
 * BDD Scenario: Canonical work requires the editorial pass
 * Given every canonical role and workflow
 * When its completion instructions are inspected
 * Then each one routes its prose through the shared editorial contract
 */
test("canonical roles and workflows require the final editorial pass", () => {
  const roles = filesUnder(".agents/roles", ".md").filter(
    (path) => !path.endsWith("/SOURCES.md"),
  );
  const workflows = filesUnder(".agents/workflows", ".md");

  // A workflow is an entry point and keeps the step as its own section; a role
  // is loaded beside one and needs the pointer, not a repeated section.
  for (const path of workflows) {
    const content = source(path);
    assert.match(content, /## Final editorial pass/, path);
    assert.ok(content.includes(contractPath), path);
  }
  for (const path of roles) {
    const content = source(path);
    assert.ok(content.includes(contractPath), path);
    assert.doesNotMatch(content, /## Final editorial pass/, path);
  }
});

/**
 * BDD Scenario: Codex skills apply the project editor
 * Given every project Codex skill
 * When the skill instructions are inspected
 * Then prose-producing skills invoke unslop and the unslop skill supports any language
 */
test("Codex skills route human-facing prose through unslop", () => {
  const skills = filesUnder(".codex/skills", "SKILL.md");
  const unslop = skills.find((path) => path.endsWith("/unslop/SKILL.md"));
  assert.ok(unslop, "missing project unslop skill");
  assert.match(source(unslop), /human-facing prose in any language/);

  for (const path of skills.filter((value) => value !== unslop)) {
    const content = source(path);
    assert.match(content, /## Final editorial pass/, path);
    assert.ok(content.includes("`unslop` skill"), path);
    assert.ok(content.includes(contractPath), path);
  }
});

/**
 * BDD Scenario: Provider adapters inherit canonical instructions
 * Given Codex and Claude role and command adapters
 * When their routing instructions are inspected
 * Then every adapter points to a canonical role or workflow that owns the editorial rule
 */
test("provider adapters route to canonical roles and workflows", () => {
  for (const path of [
    ...filesUnder(".codex/agents", ".toml"),
    ...filesUnder(".claude/agents", ".md"),
  ]) {
    assert.ok(source(path).includes(".agents/roles/"), path);
  }

  for (const path of filesUnder(".claude/commands", ".md").filter(
    (value) => !value.endsWith("/README.md"),
  )) {
    assert.ok(source(path).includes(".agents/workflows/"), path);
  }
});
