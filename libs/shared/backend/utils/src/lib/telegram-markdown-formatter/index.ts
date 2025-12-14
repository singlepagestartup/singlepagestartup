/**
 * Telegram MarkdownV2 formatter/sanitizer (stable production version).
 *
 * Accepts "AI Markdown-ish" input:
 * - Headings: # .. ####
 * - Horizontal rules: --- / *** / ___
 * - Bullet lists: - / * / +
 * - Numbered lists: 1. 2. ...
 * - Fenced code blocks: ```lang ... ```
 * - Inline code: `...`
 * - Markdown links: [text](url)
 * - Inline emphasis from AI: **bold**, *bold*, _italic_, __underline__, ~~strike~~, ||spoiler||
 *
 * Outputs a string safe for Telegram parse_mode: "MarkdownV2".
 *
 * Telegram MarkdownV2 escaping summary:
 * - In normal text escape: _ * [ ] ( ) ~ ` > # + - = | { } . !
 * - Backslash must be escaped as \\ in normal text
 * - Inside code/pre: escape ONLY ` and \
 * - Inside link URL parentheses: escape ONLY ) and \
 */

export type TgMdV2FormatOptions = {
  preserveCodeBlocks?: boolean;
  preserveInlineCode?: boolean;
  preserveMarkdownLinks?: boolean;

  normalizeLineEndings?: boolean;
  trimTrailingSpaces?: boolean;

  enableHeadings?: boolean; // "#..#### " -> bold line
  enableBulletLists?: boolean; // "-/*/+ " -> "• "
  enableNumberedLists?: boolean; // "1. " -> "1\. "
  enableHorizontalRules?: boolean; // "---" "***" "___" -> "────────"

  preserveBlankLines?: boolean; // keep empty lines
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
      enableHorizontalRules: options.enableHorizontalRules ?? true,

      preserveBlankLines: options.preserveBlankLines ?? true,
    };
  }

  /**
   * Main entry: returns safe Telegram MarkdownV2 message.
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
      text = text.replace(/\n{3,}/g, "\n\n");
    }

    // Tokenize first to protect code blocks / inline code / links from line transforms and escaping.
    const segments = this.tokenize(text);

    // Render segments into final MarkdownV2.
    return segments.map((s) => this.renderSegment(s)).join("");
  }

  // -----------------------------
  // Escaping primitives (Telegram rules)
  // -----------------------------

  // Normal text: escape backslash and specials: _ * [ ] ( ) ~ ` > # + - = | { } . !
  private escapeMarkdownV2Text(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/[_*[\]\(\)~`>#+\-=\|\{\}\.\!]/g, (m) => `\\${m}`);
  }

  // Inside code/pre: escape ONLY ` and \
  private escapeCode(code: string): string {
    return code.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
  }

  // Inside the (...) part of [text](url): escape ONLY ) and \
  private escapeLinkUrl(url: string): string {
    return url.replace(/\\/g, "\\\\").replace(/\)/g, "\\)");
  }

  // -----------------------------
  // Segment rendering
  // -----------------------------

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
        // Link text is rendered with inline markdown support + escaping.
        // URL must be escaped with link URL rules.
        const safeText = this.renderInlineMarkdown(seg.text);
        const safeUrl = this.escapeLinkUrl(seg.url);
        return "[" + safeText + "](" + safeUrl + ")";
      }

      case "text":
      default:
        return this.renderTextWithLineTransforms(seg.value);
    }
  }

  // -----------------------------
  // Line transforms for TEXT segments
  // -----------------------------

  private renderTextWithLineTransforms(text: string): string {
    const lines = text.split("\n");
    const out: string[] = [];

    for (const line of lines) {
      if (line.length === 0) {
        out.push("");
        continue;
      }

      // Horizontal rule: --- / *** / ___ (optionally with spaces)
      if (this.opts.enableHorizontalRules) {
        const trimmed = line.trim();
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
          out.push("────────");
          continue;
        }
      }

      // Headings: "# " .. "#### "
      if (this.opts.enableHeadings) {
        const h = this.parseHeading(line);
        if (h) {
          // Render as bold line (Telegram has no real heading entity).
          const content = this.renderInlineMarkdown(h.text);
          out.push("*" + content + "*");
          continue;
        }
      }

      // Bullet list: "- " "* " "+ "
      if (this.opts.enableBulletLists) {
        const b = this.parseBullet(line);
        if (b) {
          out.push("• " + this.renderInlineMarkdown(b.text));
          continue;
        }
      }

      // Numbered list: "1. item"
      if (this.opts.enableNumberedLists) {
        const n = this.parseNumbered(line);
        if (n) {
          out.push(`${n.num}\\.` + " " + this.renderInlineMarkdown(n.text));
          continue;
        }
      }

      // Regular line: keep inline markdown entities, escape the rest.
      out.push(this.renderInlineMarkdown(line));
    }

    return out.join("\n");
  }

  private parseHeading(
    line: string,
  ): { level: 1 | 2 | 3 | 4; text: string } | null {
    for (let level = 4 as 4 | 3 | 2 | 1; level >= 1; level--) {
      const prefix = "#".repeat(level) + " ";
      if (line.startsWith(prefix)) {
        return {
          level: level as 1 | 2 | 3 | 4,
          text: line.slice(prefix.length),
        };
      }
    }
    return null;
  }

  private parseBullet(line: string): { text: string } | null {
    if (line.startsWith("- ")) return { text: line.slice(2) };
    if (line.startsWith("* ")) return { text: line.slice(2) };
    if (line.startsWith("+ ")) return { text: line.slice(2) };
    return null;
  }

  private parseNumbered(line: string): { num: number; text: string } | null {
    const m = /^(\d+)\.\s+(.*)$/.exec(line);
    if (!m) return null;
    const num = Number(m[1]);
    if (!Number.isFinite(num)) return null;
    return { num, text: m[2] };
  }

  // -----------------------------
  // Inline markdown conversion (AI Markdown-ish -> Telegram MarkdownV2)
  // -----------------------------

  /**
   * Converts common inline entities into Telegram MarkdownV2 and escapes everything else.
   *
   * Supported entities:
   * - **bold** -> *bold*
   * - *bold* -> *bold*
   * - __underline__ -> __underline__
   * - _italic_ -> _italic_
   * - ~~strike~~ -> ~strike~
   * - ||spoiler|| -> ||spoiler||
   *
   * Important: We DO NOT escape the whole line at the end.
   * We escape only plain text parts and keep entity delimiters intact.
   * This avoids cases where reserved chars like '(' appear unescaped in final output.
   */
  private renderInlineMarkdown(input: string): string {
    // We replace entities with unique placeholders, but we DO NOT escape the entire string.
    // Instead, we escape only the plain-text regions between placeholders, and then insert
    // placeholders' already-escaped values verbatim.

    type Tok = { id: string; value: string };
    const tokens: Tok[] = [];

    const makeToken = (value: string) => {
      const id = `\u0000T${tokens.length}\u0000`;
      tokens.push({ id, value });
      return id;
    };

    let s = input;

    // 1) Spoiler: ||...||
    s = s.replace(/\|\|([\s\S]+?)\|\|/g, (_m, inner) => {
      return makeToken("||" + this.escapeMarkdownV2Text(String(inner)) + "||");
    });

    // 2) Underline: __...__
    s = s.replace(/__([\s\S]+?)__/g, (_m, inner) => {
      return makeToken("__" + this.escapeMarkdownV2Text(String(inner)) + "__");
    });

    // 3) Strikethrough: ~~...~~ -> ~...~
    s = s.replace(/~~([\s\S]+?)~~/g, (_m, inner) => {
      return makeToken("~" + this.escapeMarkdownV2Text(String(inner)) + "~");
    });

    // 4) Bold: **...** -> *...*
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, (_m, inner) => {
      return makeToken("*" + this.escapeMarkdownV2Text(String(inner)) + "*");
    });

    // 5) Bold: *...* (single asterisks), conservative (won't match "**")
    s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, (_m, p1, inner) => {
      return makeToken(
        p1 + "*" + this.escapeMarkdownV2Text(String(inner)) + "*",
      );
    });

    // 6) Italic: _..._ (single underscores), conservative (won't match "__")
    s = s.replace(/(^|[^_])_([^_\n]+?)_(?!_)/g, (_m, p1, inner) => {
      return makeToken(
        p1 + "_" + this.escapeMarkdownV2Text(String(inner)) + "_",
      );
    });

    // Now we escape only the plain text between token ids.
    if (tokens.length === 0) {
      return this.escapeMarkdownV2Text(s);
    }

    let result = "";
    let cursor = 0;

    for (const t of tokens) {
      const idx = s.indexOf(t.id, cursor);
      if (idx === -1) continue;

      // Escape the plain segment before the token
      result += this.escapeMarkdownV2Text(s.slice(cursor, idx));

      // Insert token value verbatim (already escaped internally)
      result += t.value;

      cursor = idx + t.id.length;
    }

    // Escape remaining tail
    result += this.escapeMarkdownV2Text(s.slice(cursor));

    return result;
  }

  // -----------------------------
  // Tokenizer: code blocks / links / inline code
  // -----------------------------

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

    // earliest start; tie-break: codeBlock > link > inlineCode
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

    const afterStart = start + 3;

    const nl = s.indexOf("\n", afterStart);
    if (nl === -1) return null;

    const lang = s.slice(afterStart, nl).trim();
    const bodyStart = nl + 1;

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

    // If it is a fence, let codeBlock handle it
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
}

export function util(props: { input: string }): string {
  const telegramMessageSanitizer = new TelegramMarkdownV2Formatter({});

  return telegramMessageSanitizer.format(props.input);
}
