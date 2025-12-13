import { Context } from "hono";
import { getCookie } from "hono/cookie";

/**
 * Telegram MarkdownV2 formatter/sanitizer that is stable for production.
 *
 * Supports:
 * - Headings from AI input: "# " .. "#### " (converted to bold heading lines)
 * - Bullet lists from AI input: "- ", "* ", "+ " (converted to "• " items)
 * - Numbered lists from AI input: "1. " "2. " ... (kept as numbers, dot escaped)
 * - Fenced code blocks: ```lang ... ```
 * - Inline code: `...`
 * - Markdown links: [text](url)
 *
 * Key goals:
 * - Do not crash Telegram with "can't parse entities"
 * - Do not change the text content (words/facts), only presentational structure
 * - Always produce valid MarkdownV2 for parse_mode: "MarkdownV2"
 *
 * Telegram MarkdownV2 escaping rules (summary):
 * - In normal text escape: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * - Backslash must be escaped as \\ in normal text
 * - Inside code/pre: escape ONLY ` and \ (prefix with \)
 * - Inside link URL parentheses: escape ONLY ) and \ (prefix with \)
 */

export type TgMdV2FormatOptions = {
  preserveCodeBlocks?: boolean;
  preserveInlineCode?: boolean;
  preserveMarkdownLinks?: boolean;

  normalizeLineEndings?: boolean;
  trimTrailingSpaces?: boolean;

  // If true, convert "#..#### " headings to bold heading lines
  enableHeadings?: boolean;

  // If true, convert "-/*/+ " bullet items to "• " items
  enableBulletLists?: boolean;

  // If true, keep "1. " lists as "1\." (dot escaped) while keeping spacing
  enableNumberedLists?: boolean;

  // If true, keep empty lines as-is; otherwise, collapse 3+ empty lines to 2
  preserveBlankLines?: boolean;
};

type Segment =
  | { kind: "text"; value: string }
  | { kind: "codeBlock"; value: string; lang?: string }
  | { kind: "inlineCode"; value: string }
  | { kind: "link"; text: string; url: string };

export class TelegramMarkdownV2Formatter {
  private opts: Required<TgMdV2FormatOptions>;

  constructor(options: TgMdV2FormatOptions = {}) {
    this.opts = {
      preserveCodeBlocks: options.preserveCodeBlocks ?? true,
      preserveInlineCode: options.preserveInlineCode ?? true,
      preserveMarkdownLinks: options.preserveMarkdownLinks ?? true,

      normalizeLineEndings: options.normalizeLineEndings ?? true,
      trimTrailingSpaces: options.trimTrailingSpaces ?? true,

      enableHeadings: options.enableHeadings ?? true,
      enableBulletLists: options.enableBulletLists ?? true,
      enableNumberedLists: options.enableNumberedLists ?? true,

      preserveBlankLines: options.preserveBlankLines ?? true,
    };
  }

  /**
   * Format raw AI/user text into safe Telegram MarkdownV2.
   */
  format(input: string): string {
    let text = input ?? "";

    if (this.opts.normalizeLineEndings) {
      text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }

    if (this.opts.trimTrailingSpaces) {
      text = text
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/g, ""))
        .join("\n");
    }

    if (!this.opts.preserveBlankLines) {
      // Collapse 3+ blank lines to 2
      text = text.replace(/\n{3,}/g, "\n\n");
    }

    // Tokenize first: protect code blocks / inline code / links from line transforms.
    const segments = this.tokenize(text);

    // Render each segment; for TEXT segments, apply line-level transforms (headings/lists),
    // then escape MarkdownV2 special chars.
    return segments.map((s) => this.renderSegment(s)).join("");
  }

  /**
   * Escapes normal text for MarkdownV2.
   */
  escapeText(text: string): string {
    return this.escapeMarkdownV2Text(text);
  }

  /**
   * Escapes content inside inline code or pre blocks.
   * Only ` and \ must be escaped in Telegram MarkdownV2 code/pre entities.
   */
  escapeCode(code: string): string {
    return code.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  }

  /**
   * Escapes URL inside parentheses of [text](url).
   * Only ) and \ must be escaped in Telegram MarkdownV2 link URL.
   */
  escapeLinkUrl(url: string): string {
    return url.replace(/\\/g, "\\\\").replace(/\)/g, "\\)");
  }

  /**
   * Escapes visible link text like normal text.
   */
  escapeLinkText(text: string): string {
    return this.escapeMarkdownV2Text(text);
  }

  // -----------------------------
  // Internals
  // -----------------------------

  private escapeMarkdownV2Text(text: string): string {
    // Escape backslash first, then escape required specials.
    // Special chars: _ * [ ] ( ) ~ ` > # + - = | { } . !
    return text
      .replace(/\\/g, "\\\\")
      .replace(/[_*\[\]\(\)~`>#+\-=|{}.!]/g, (m) => `\\${m}`);
  }

  private tokenize(input: string): Segment[] {
    const segments: Segment[] = [];
    let i = 0;

    while (i < input.length) {
      const next = this.findNextToken(input, i);

      if (!next) {
        segments.push({ kind: "text", value: input.slice(i) });
        break;
      }

      if (next.start > i) {
        segments.push({ kind: "text", value: input.slice(i, next.start) });
      }

      segments.push(next.segment);
      i = next.end;
    }

    return segments;
  }

  private findNextToken(
    s: string,
    from: number,
  ): { start: number; end: number; segment: Segment } | null {
    type Found = { start: number; end: number; segment: Segment };
    const found: Found[] = [];

    if (this.opts.preserveCodeBlocks) {
      const cb = this.findFencedCodeBlock(s, from);
      if (cb) found.push(cb);
    }

    if (this.opts.preserveMarkdownLinks) {
      const link = this.findMarkdownLink(s, from);
      if (link) found.push(link);
    }

    if (this.opts.preserveInlineCode) {
      const ic = this.findInlineCode(s, from);
      if (ic) found.push(ic);
    }

    if (found.length === 0) return null;

    // Earliest; tie-break: codeBlock > link > inlineCode
    found.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      const prio = (seg: Segment) => {
        if (seg.kind === "codeBlock") return 0;
        if (seg.kind === "link") return 1;
        if (seg.kind === "inlineCode") return 2;
        return 3;
      };
      return prio(a.segment) - prio(b.segment);
    });

    return found[0];
  }

  private findFencedCodeBlock(
    s: string,
    from: number,
  ): { start: number; end: number; segment: Segment } | null {
    const start = s.indexOf("```", from);
    if (start === -1) return null;

    // Ignore if it's not a fence start (we only support triple backticks)
    const afterStart = start + 3;

    // Optional language tag up to first newline
    let lang = "";
    let bodyStart = afterStart;

    const nl = s.indexOf("\n", afterStart);
    if (nl !== -1) {
      lang = s.slice(afterStart, nl).trim();
      bodyStart = nl + 1;
    } else {
      // No newline after ``` -> malformed for a block, do not match
      return null;
    }

    const endFence = s.indexOf("```", bodyStart);
    if (endFence === -1) return null;

    const body = s.slice(bodyStart, endFence);

    return {
      start,
      end: endFence + 3,
      segment: { kind: "codeBlock", value: body, lang: lang || undefined },
    };
  }

  private findInlineCode(
    s: string,
    from: number,
  ): { start: number; end: number; segment: Segment } | null {
    const start = s.indexOf("`", from);
    if (start === -1) return null;

    // If it's a code fence, let codeBlock matcher handle it
    if (s.slice(start, start + 3) === "```") return null;

    const end = s.indexOf("`", start + 1);
    if (end === -1) return null;

    const body = s.slice(start + 1, end);

    return {
      start,
      end: end + 1,
      segment: { kind: "inlineCode", value: body },
    };
  }

  private findMarkdownLink(
    s: string,
    from: number,
  ): { start: number; end: number; segment: Segment } | null {
    // Conservative parser for [text](url)
    const start = s.indexOf("[", from);
    if (start === -1) return null;

    const closeBracket = s.indexOf("]", start + 1);
    if (closeBracket === -1) return null;

    if (s[closeBracket + 1] !== "(") return null;

    const closeParen = this.findMatchingParen(s, closeBracket + 1);
    if (closeParen === -1) return null;

    const text = s.slice(start + 1, closeBracket);
    const url = s.slice(closeBracket + 2, closeParen);

    if (!url.trim()) return null;

    return {
      start,
      end: closeParen + 1,
      segment: { kind: "link", text, url },
    };
  }

  private findMatchingParen(s: string, openParenIndex: number): number {
    // openParenIndex points to '('
    if (s[openParenIndex] !== "(") return -1;
    for (let i = openParenIndex + 1; i < s.length; i++) {
      const ch = s[i];
      if (ch === "\\") {
        i++; // skip escaped char
        continue;
      }
      if (ch === ")") return i;
    }
    return -1;
  }

  private renderSegment(seg: Segment): string {
    switch (seg.kind) {
      case "codeBlock": {
        const lang = seg.lang ? seg.lang.replace(/`/g, "").trim() : "";
        const body = this.escapeCode(seg.value);
        return "```" + lang + "\n" + body + "\n```";
      }

      case "inlineCode":
        return "`" + this.escapeCode(seg.value) + "`";

      case "link": {
        const t = this.escapeLinkText(seg.text);
        const u = this.escapeLinkUrl(seg.url);
        return "[" + t + "](" + u + ")";
      }

      case "text":
      default:
        return this.renderTextWithLineTransforms(seg.value);
    }
  }

  private renderTextWithLineTransforms(text: string): string {
    const lines = text.split("\n");
    const out: string[] = [];

    for (const line of lines) {
      // Keep blank lines
      if (line.length === 0) {
        out.push("");
        continue;
      }

      // Headings: "# " .. "#### "
      if (this.opts.enableHeadings) {
        const h = this.parseHeading(line);
        if (h) {
          // Convert to bold heading line. Escape heading text as normal text.
          // Example: "# Title" -> "*Title*"
          const escaped = this.escapeMarkdownV2Text(h.text);
          out.push("*" + escaped + "*");
          continue;
        }
      }

      // Bullet lists: "- " "* " "+ "
      if (this.opts.enableBulletLists) {
        const b = this.parseBullet(line);
        if (b) {
          // Use bullet symbol to avoid '-' parsing quirks.
          const escaped = this.escapeMarkdownV2Text(b.text);
          out.push("• " + escaped);
          continue;
        }
      }

      // Numbered lists: "1. " "2. " ...
      if (this.opts.enableNumberedLists) {
        const n = this.parseNumbered(line);
        if (n) {
          // Escape dot after number: "1\."
          const escaped = this.escapeMarkdownV2Text(n.text);
          out.push(`${n.num}\\.` + " " + escaped);
          continue;
        }
      }

      // Default: escape full line as normal text
      out.push(this.escapeMarkdownV2Text(line));
    }

    return out.join("\n");
  }

  private parseHeading(
    line: string,
  ): { level: 1 | 2 | 3 | 4; text: string } | null {
    // Match "# " .. "#### " exactly at line start
    // Do not treat "##### " or "#no-space" as a heading.
    for (let level = 4 as 4 | 3 | 2 | 1; level >= 1; level--) {
      const prefix = "#".repeat(level) + " ";
      if (line.startsWith(prefix)) {
        const text = line.slice(prefix.length);
        return { level: level as 1 | 2 | 3 | 4, text };
      }
    }
    return null;
  }

  private parseBullet(line: string): { text: string } | null {
    // "- " "* " "+ " at start
    if (line.startsWith("- ")) return { text: line.slice(2) };
    if (line.startsWith("* ")) return { text: line.slice(2) };
    if (line.startsWith("+ ")) return { text: line.slice(2) };
    return null;
  }

  private parseNumbered(line: string): { num: number; text: string } | null {
    // "1. " style
    // Only accept if number is at least 1 digit and followed by ". "
    const m = /^(\d+)\.\s+(.*)$/.exec(line);
    if (!m) return null;
    const num = Number(m[1]);
    if (!Number.isFinite(num)) return null;
    return { num, text: m[2] };
  }
}

export function util(c: Context) {
  const authorizationCookie = getCookie(c, "rbac.subject.jwt");
  const authorizationHeader = c.req.header("Authorization");
  const authorization =
    authorizationCookie || authorizationHeader?.replace("Bearer ", "");

  return authorization;
}
