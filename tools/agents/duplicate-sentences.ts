/**
 * Fail when one instruction sentence has two homes.
 *
 * The pre-development corpus is loaded per invocation, so a rule repeated in a
 * contract, a role and an entry file costs tokens three times and drifts when
 * only one copy is edited. One home per rule is the standing decision; this
 * check keeps the corpus there after the rewrite.
 *
 * A home is not a file. `CLAUDE.md` and `AGENTS.md` are one entry point written
 * twice for two providers, and the Claude commands and Codex skills are one
 * adapter layer over the canonical workflows; both are required to say the same
 * thing, so a sentence shared inside one of them is not a second home.
 *
 * Usage: bun tools/agents/duplicate-sentences.ts [--repository-root <path>]
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOTS = [".agents", ".claude/commands", ".codex/skills"] as const;
const FILES = ["CLAUDE.md", "AGENTS.md"] as const;

/** Rules whose wording is deliberately repeated, with the reason it is. */
const ALLOWED: Array<{ match: RegExp; reason: string }> = [
  {
    match: /editorial-pass\.md|`unslop` skill/,
    reason:
      "Every role, workflow and skill is loaded on its own, so the pointer to the editorial contract and its pattern reference travels with each one; tools/agents/editorial-pass.test.mjs requires it. The rules themselves have one home.",
  },
];

/**
 * Duplication that predates this check, all of it in the engineering
 * workflows and their command adapters. The pre-development compaction did
 * not rewrite that corpus, so these are recorded rather than hidden: the check
 * still fails on anything new, and it reports a baseline entry that has
 * stopped being duplicated so the list can shrink.
 */
const KNOWN = [
  'Do not use bare `gh repo view` to derive `REPO_NAME`, and do not run raw `gh issue ...` commands without `--repo "$REPO_FULL_NAME"` unless a shared helper is being used.',
  "Before any status gate, GitHub issue command, or `thoughts/shared/...` path resolution, follow `.agents/contracts/engineering/repository-context.md`.",
  "Resolve `ISSUE_NUMBER`: If an issue number is passed, use it.",
  "If no suitable issue exists, exit and report that no `size:xs`/`size:small` issue is ready.",
  "This wrapper exists only to preserve old command entry points.",
  "**Key principle**: Review and alignment happen at the plan stage (not PR stage) to move faster and avoid rework.",
  "Since the operator explicitly chose the combined flow, advance it and continue:",
  "All status gates, artifacts, and issue comments of both phases apply unchanged.",
  "After phases that require human review (Research in Review, Plan in Review): manually advance the issue status in GitHub Project, then run `/core/next` again.",
  'After PR merge: manually move the issue to "Done" in GitHub Project.',
];

/** A sentence shorter than this coincides by chance rather than by copying. */
const MINIMUM_WORDS = 10;

/** Files that are two spellings of the same instruction share a home. */
function home(relative: string): string {
  if (relative === "CLAUDE.md" || relative === "AGENTS.md") return "entry";
  if (relative.startsWith(".claude/commands/")) return "adapter";
  if (relative.startsWith(".codex/skills/")) return "adapter";
  return relative;
}

function normalize(sentence: string): string {
  return sentence
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[.;:,]+$/, "");
}

/** Prose only: code, tables, headings and metadata are structure, not rules. */
function sentences(markdown: string): string[] {
  const prose = markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .replace(/^ {0,3}(```|~~~)[\s\S]*?\1[ \t]*$/gm, "")
    .split("\n")
    .filter((line) => !/^\s*(#{1,6}\s|\||>)/.test(line))
    .map((line) => line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""))
    .join("\n");
  return (
    prose
      .split(/(?<=[.!?])\s+|\n{2,}/)
      // A template comment holds the instruction, so only its markers go; `--!>`
      // closes a comment as well as `-->`.
      .map((sentence) => sentence.replace(/<!--|--!?>/g, " ").trim())
      .filter((sentence) => sentence.split(/\s+/).length >= MINIMUM_WORDS)
  );
}

async function markdownFiles(root: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(directory: string) {
    for (const name of await readdir(directory).catch(() => [] as string[])) {
      const file = path.join(directory, name);
      if ((await stat(file)).isDirectory()) await walk(file);
      else if (name.endsWith(".md")) found.push(file);
    }
  }
  await walk(root);
  return found.sort();
}

export interface IDuplicateSentence {
  sentence: string;
  homes: string[];
  files: string[];
  known: boolean;
}

export async function findDuplicateSentences(
  repositoryRoot: string,
): Promise<IDuplicateSentence[]> {
  const files = [
    ...(
      await Promise.all(
        ROOTS.map((root) => markdownFiles(path.join(repositoryRoot, root))),
      )
    ).flat(),
    ...FILES.map((file) => path.join(repositoryRoot, file)),
  ];
  const seen = new Map<
    string,
    { original: string; homes: Set<string>; files: Set<string> }
  >();
  for (const file of files) {
    const content = await readFile(file, "utf8").catch(() => "");
    const relative = path.relative(repositoryRoot, file);
    for (const sentence of sentences(content)) {
      if (ALLOWED.some(({ match }) => match.test(sentence))) continue;
      const key = normalize(sentence);
      const entry = seen.get(key) ?? {
        original: sentence,
        homes: new Set<string>(),
        files: new Set<string>(),
      };
      entry.homes.add(home(relative));
      entry.files.add(relative);
      seen.set(key, entry);
    }
  }
  const known = new Set(KNOWN.map(normalize));
  return [...seen.entries()]
    .filter(([, { homes }]) => homes.size > 1)
    .map(([key, { original, homes, files }]) => ({
      sentence: original.replace(/\s+/g, " "),
      homes: [...homes].sort(),
      files: [...files].sort(),
      known: known.has(key),
    }))
    .sort((left, right) => right.homes.length - left.homes.length);
}

/** Baseline entries that no longer duplicate anything and can be deleted. */
export function retiredBaseline(found: IDuplicateSentence[]): string[] {
  const still = new Set(found.map(({ sentence }) => normalize(sentence)));
  return KNOWN.filter((sentence) => !still.has(normalize(sentence)));
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (import.meta.main) {
  const repositoryRoot = path.resolve(option("--repository-root") ?? ".");
  const duplicates = await findDuplicateSentences(repositoryRoot);
  const fresh = duplicates.filter(({ known }) => !known);
  const retired = retiredBaseline(duplicates);
  for (const { sentence, files } of fresh) {
    process.stdout.write(`\n${sentence}\n`);
    for (const file of files) process.stdout.write(`  ${file}\n`);
  }
  if (fresh.length) {
    process.stdout.write(
      `\n${fresh.length} sentence(s) have more than one home. Move each rule to the document that owns it and point at it from the others, or add it to ALLOWED in this file with the reason both copies exist.\n`,
    );
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `Agent instructions: every rule has one home, beside ${duplicates.length} recorded in the baseline. OK.\n`,
    );
  }
  for (const sentence of retired)
    process.stdout.write(
      `\nBaseline entry is no longer duplicated; remove it from KNOWN:\n  ${sentence}\n`,
    );
}
