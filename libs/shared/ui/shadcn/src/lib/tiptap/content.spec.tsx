/**
 * BDD Suite: read-only rich text is available before hydration.
 * Given: persisted TipTap JSON or legacy plain text.
 * When: the public TipTap view renders on the server or mounts in a browser.
 * Then: semantic content is present immediately, unsafe links are inert, and copy works.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TipTap, TipTapContent } from "./index";
import { useEditor } from "@tiptap/react";

jest.mock("@tiptap/react", () => ({
  useEditor: jest.fn(() => null),
  EditorContent: () => null,
  ReactNodeViewRenderer: jest.fn(),
  NodeViewWrapper: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("sonner", () => ({ toast: { info: jest.fn(), error: jest.fn() } }));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(" "),
}));

beforeEach(() => jest.clearAllMocks());

function markup(value: string | object) {
  return renderToStaticMarkup(
    <TipTap
      value={typeof value === "string" ? value : JSON.stringify(value)}
    />,
  );
}

describe("server-rendered rich text", () => {
  it("renders headings, formatting, lists, links, code and breaks without creating an editor", () => {
    const html = markup({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Article heading" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Article body",
              marks: [{ type: "bold" }, { type: "italic" }],
            },
            { type: "hardBreak" },
            {
              type: "text",
              text: "Read more",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "/ru/blog",
                    target: "_blank",
                    rel: "nofollow",
                  },
                },
              ],
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item" }],
                },
              ],
            },
          ],
        },
        {
          type: "orderedList",
          attrs: { start: 3 },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Third" }],
                },
              ],
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Quote" }] },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "js" },
          content: [{ type: "text", text: "a < b" }],
        },
        { type: "horizontalRule" },
      ],
    });

    expect(html).toContain("<h2>Article heading</h2>");
    expect(html).toContain("<em><strong>Article body</strong></em><br/>");
    expect(html).toContain(
      '<a href="/ru/blog" target="_blank" rel="nofollow noopener noreferrer">Read more</a>',
    );
    expect(html).toContain("<ul><li><p>Item</p></li></ul>");
    expect(html).toContain('<ol start="3"><li><p>Third</p></li></ol>');
    expect(html).toContain("<blockquote><p>Quote</p></blockquote>");
    expect(html).toContain(
      '<pre><code class="language-js">a &lt; b</code></pre>',
    );
    expect(html).toContain("<hr/>");
    expect(useEditor).not.toHaveBeenCalled();
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,test",
    "vbscript:msgbox(1)",
    "java\nscript:alert(1)",
  ])("renders link text without a clickable unsafe %s URL", (href) => {
    const html = markup({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Visible text",
              marks: [{ type: "link", attrs: { href } }],
            },
          ],
        },
      ],
    });
    expect(html).toContain("<p>Visible text</p>");
    expect(html).not.toContain("<a ");
  });

  it.each([
    "https://example.com/article",
    "mailto:author@example.com",
    "tel:+12345",
    "#section",
    "../article",
  ])("retains safe %s links", (href) => {
    const html = markup({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Link",
              marks: [{ type: "link", attrs: { href } }],
            },
          ],
        },
      ],
    });
    expect(html).toContain(`href="${href}"`);
  });

  it("escapes persisted markup and preserves plain text and malformed JSON", () => {
    expect(markup("<script>alert(1)</script>")).toContain(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(markup("{invalid json")).toContain("<p>{invalid json</p>");
    expect(markup("42")).toContain("<p>42</p>");
    expect(
      markup({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: '<img src=x onerror="alert(1)">' }],
          },
        ],
      }),
    ).not.toContain("<img");
  });

  it("renders parsed documents, keeps children of unknown nodes and ignores arbitrary attributes", () => {
    const html = renderToStaticMarkup(
      <TipTapContent
        value={{
          type: "doc",
          content: [
            {
              type: "custom",
              attrs: { onclick: "alert(1)" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Preserved" }],
                },
              ],
            },
          ],
        }}
      />,
    );
    expect(html).toContain("<p>Preserved</p>");
    expect(html).not.toContain("onclick");
  });

  it("renders the copy button before hydration", () => {
    const value = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "copyButton", attrs: { text: "Saved copy value" } },
          ],
        },
      ],
    };
    expect(markup(value)).toContain('aria-label="Copy text"');
  });

  it("keeps the editable mode connected to the editor", () => {
    renderToStaticMarkup(
      <TipTap
        {...({
          value: '{"type":"doc","content":[]}',
          editable: true,
          name: "body",
          form: { setValue: jest.fn() },
          field: {},
        } as any)}
      />,
    );
    expect(useEditor).toHaveBeenCalledTimes(1);
  });
});
