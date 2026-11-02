/**
 * A workspace document states what is in force. The event that produced a
 * statement — a revision, a rejected alternative, the date a review happened —
 * belongs to Git and to the attribution fields beside the statement, never to
 * the body. `.agents/contracts/editorial-pass.md` states the rule and
 * `.agents/workflows/pre-development.md` forbids a change log in the workspace;
 * this module turns the shapes that break both into a checkable finding.
 */

export interface IChangeLogFinding {
  /** 1-based line of the inspected body, so a report can point at the sentence. */
  line: number;
  match: string;
  detail: string;
}

interface IChangeLogShape {
  pattern: RegExp;
  detail: string;
  /**
   * A table column such as Источник or Reference inputs is an attribution
   * surface, so a date belongs there. Contrast wording never does.
   */
  proseOnly?: boolean;
}

const CONTRAST_DETAIL =
  "wording that contrasts an earlier edition with the one in force; replace the obsolete statement instead of naming it";

/**
 * Cyrillic is outside the ASCII `\b` class, so every shape uses explicit
 * letter-boundary lookarounds rather than word boundaries.
 */
const SHAPES: IChangeLogShape[] = [
  {
    pattern: /(?<![\p{L}\p{N}])\d{4}-\d{2}-\d{2}(?![\p{L}\p{N}])/gu,
    detail:
      "a date inside a statement; dates belong to the attribution beside it, in fields such as at, source, accessed or confirmation",
    proseOnly: true,
  },
  {
    pattern:
      /(?<![\p{L}\p{N}])(?:прежн\p{L}*|предыдущ\p{L}*|ранее|раньше|редакци[яию]|устаревш\p{L}*)(?![\p{L}\p{N}])/giu,
    detail: CONTRAST_DETAIL,
  },
  {
    pattern:
      /(?<![\p{L}\p{N}])(?:previously|formerly|earlier (?:version|edition|draft)|prior (?:version|edition)|used to|superseded|change ?log)(?![\p{L}\p{N}])/giu,
    detail: CONTRAST_DETAIL,
  },
];

/** Keep the line count so a finding can name the line it came from. */
function blank(text: string): string {
  return text.replace(/[^\n]/g, " ");
}

/**
 * Fenced code, inline code, link targets and HTML comments carry dates that are
 * identifiers or paths rather than statements, so they are masked before the
 * shapes run.
 */
export function inspectableProse(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/`[^`\n]*`/g, blank)
    .replace(/\]\([^)\n]*\)/g, blank);
}

/** Every change-log shape in a document body, in reading order. */
export function findChangeLogShapes(body: string): IChangeLogFinding[] {
  const prose = inspectableProse(body);
  const lines = prose.split("\n");
  const findings: IChangeLogFinding[] = [];
  for (const { pattern, detail, proseOnly } of SHAPES) {
    pattern.lastIndex = 0;
    for (const match of prose.matchAll(pattern)) {
      const line = prose.slice(0, match.index).split("\n").length;
      if (proseOnly && lines[line - 1].trimStart().startsWith("|")) continue;
      findings.push({ line, match: match[0], detail });
    }
  }
  return findings.sort(
    (left, right) =>
      left.line - right.line || left.match.localeCompare(right.match),
  );
}
