/**
 * Fail when a workspace statement records the act of deciding instead of the state.
 *
 * `.agents/contracts/editorial-pass.md` requires every statement to describe a
 * state, past, future or current, and keeps dates, names and approval in the
 * attribution beside it. A document that says "the operator decided on <date>
 * that tokens do not expire" has become a transcript of a conversation: the
 * fact is buried in an event, the date duplicates `source`, and a later reader
 * cannot tell the current decision from the one it replaced. Git keeps that
 * history already.
 *
 * Two shapes are reported. A decision verb attributed to the operator inside a
 * statement is always one, because the attribution fields exist for exactly
 * that. A decision that carries its own date, joined by `on`, is the second:
 * that is how a living document turns into a change log.
 *
 * Attribution fields are exempt: `source`, `date`, `at`, `accessed`,
 * `inspected_at`, `inspected_snapshot`, `head` and the `confirmation` block
 * are where this information belongs.
 *
 * Usage: bun tools/agents/statement-form.ts [--repository-root <path>]
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const WORKSPACE = "apps/studio/workspace";

/** Directories holding rendering code and machine state, not reviewed prose. */
const SKIP_DIRECTORIES = new Set(["utils", "assets", "styles"]);

/** Frontmatter keys whose value is a statement rather than its attribution. */
const STATEMENT_KEYS = new Set([
  "scope",
  "limitation",
  "supports",
  "findings",
  "summary",
  "use",
]);

const DECISION_VERB =
  "decided|selected|chose|chosen|accepted|approved|confirmed|set|read|considered|directed|picked|rejected";

/** "the operator decided", "selected by the operator" and their relatives. */
const ATTRIBUTED_DECISION = new RegExp(
  `\\b(?:the\\s+)?operator\\s+(?:${DECISION_VERB})\\b|\\b(?:${DECISION_VERB})\\s+by\\s+the\\s+operator\\b`,
  "i",
);

/**
 * A decision carrying its own date, in either order.
 *
 * The date has to be attached to the decision by `on`, so that a source
 * accessed on a date, a survey field window or a self-selected sample is not
 * mistaken for a dated decision.
 */
const DATED_DECISION_VERB =
  "decided|selected|chose|chosen|accepted|approved|rejected|picked";

const DATED_DECISION = new RegExp(
  `\\b(?:${DATED_DECISION_VERB})\\b[^.]{0,40}?\\bon\\s+\\d{4}-\\d{2}-\\d{2}\\b` +
    `|\\bon\\s+\\d{4}-\\d{2}-\\d{2}\\b[^.]{0,40}?\\b(?:${DATED_DECISION_VERB})\\b`,
  "i",
);

export interface IStatementFinding {
  file: string;
  line: number;
  rule: "attributed-decision" | "dated-decision";
  text: string;
}

/** Split on sentence ends so one finding cannot span two statements. */
function sentences(value: string): string[] {
  return value.split(/(?<=[.!?])\s+/);
}

export function inspectStatement(value: string): IStatementFinding["rule"][] {
  const rules: IStatementFinding["rule"][] = [];
  if (ATTRIBUTED_DECISION.test(value)) rules.push("attributed-decision");
  if (sentences(value).some((sentence) => DATED_DECISION.test(sentence))) {
    rules.push("dated-decision");
  }
  return rules;
}

/**
 * Report the statement lines of one document.
 *
 * Frontmatter is walked by key so attribution stays exempt; the body is prose
 * throughout. Both are scanned line by line so a finding can name its line.
 */
export function inspectDocument(
  file: string,
  source: string,
): IStatementFinding[] {
  const findings: IStatementFinding[] = [];
  const lines = source.split("\n");
  const markdown = file.endsWith(".md");
  let inFrontmatter = markdown && lines[0]?.trim() === "---";
  let statementIndent: number | null = null;

  lines.forEach((line, index) => {
    if (inFrontmatter && index > 0 && line.trim() === "---") {
      inFrontmatter = false;
      return;
    }
    if (markdown && index === 0) return;

    const indent = line.length - line.trimStart().length;
    let checked = false;

    if (inFrontmatter || !markdown) {
      const key = /^\s*(?:-\s+)?([A-Za-z_][\w-]*)\s*:/.exec(line)?.[1];
      if (key) {
        statementIndent = STATEMENT_KEYS.has(key) ? indent : null;
        checked = statementIndent !== null;
      } else if (statementIndent !== null && indent > statementIndent) {
        checked = true;
      } else if (line.trim() !== "") {
        statementIndent = null;
      }
    } else {
      checked = line.trim() !== "";
    }

    if (!checked) return;
    for (const rule of inspectStatement(line)) {
      findings.push({ file, line: index + 1, rule, text: line.trim() });
    }
  });

  return findings;
}

async function documentsUnder(root: string): Promise<string[]> {
  const found: string[] = [];
  const walk = async (relative: string) => {
    const absolute = path.join(root, relative);
    for (const entry of await readdir(absolute)) {
      const next = path.join(relative, entry);
      if ((await stat(path.join(root, next))).isDirectory()) {
        if (relative === WORKSPACE && SKIP_DIRECTORIES.has(entry)) continue;
        await walk(next);
      } else if (next.endsWith(".md") || next.endsWith(".yaml")) {
        found.push(next);
      }
    }
  };
  await walk(WORKSPACE);
  return found.sort();
}

export async function checkStatementForm(
  repositoryRoot: string,
): Promise<IStatementFinding[]> {
  const findings: IStatementFinding[] = [];
  for (const file of await documentsUnder(repositoryRoot)) {
    const source = await readFile(path.join(repositoryRoot, file), "utf8");
    findings.push(...inspectDocument(file, source));
  }
  return findings;
}

const REASON: Record<IStatementFinding["rule"], string> = {
  "attributed-decision":
    "names the operator as the actor; state the decision and leave the attribution to `source`",
  "dated-decision":
    "dates a decision inside the statement; move the date to `source`, `date` or `accessed`",
};

if (import.meta.main) {
  const argument = process.argv.indexOf("--repository-root");
  const repositoryRoot =
    argument === -1 ? process.cwd() : process.argv[argument + 1];
  const findings = await checkStatementForm(repositoryRoot);
  if (!findings.length) {
    console.log("Statement form: every workspace statement describes a state.");
    process.exit(0);
  }
  console.error(
    `Statement form: ${findings.length} statement(s) record a decision instead of a state.\n`,
  );
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}]`);
    console.error(`  ${REASON[finding.rule]}`);
    console.error(`  ${finding.text.slice(0, 160)}\n`);
  }
  process.exit(1);
}
