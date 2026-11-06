import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "bun:test";
import { MarkdownDocument } from "./Markdown";

describe("Markdown document preview", () => {
  test("renders structured Markdown without changing code indentation", () => {
    const html = renderToStaticMarkup(
      <MarkdownDocument disableRawHTML>
        {
          "    indented code\n\n### Offer\n\n**Cup workshop** and *small groups*.\n\n- Materials\n- Instruction\n\n| Offer | Price |\n| --- | --- |\n| Cup | Unknown |\n\n> Review the scope."
        }
      </MarkdownDocument>,
    );
    expect(html).toContain("<pre><code>indented code");
    expect(html).toContain("<h3");
    expect(html).toContain("<strong>Cup workshop</strong>");
    expect(html).toContain("<em>small groups</em>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<table>");
    expect(html).toContain("<blockquote>");
  });

  test("keeps raw HTML inert and rejects executable link URLs in user previews", () => {
    const html = renderToStaticMarkup(
      <MarkdownDocument disableRawHTML externalLinksNewTab>
        {
          '<iframe src="https://example.com"></iframe>\n\n<script>alert(1)</script>\n\n[Unsafe](javascript:alert%281%29)\n\n[Research](https://example.com/research)'
        }
      </MarkdownDocument>,
    );
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<script");
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="https://example.com/research"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
