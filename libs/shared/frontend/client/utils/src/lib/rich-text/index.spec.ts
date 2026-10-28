import { getRichTextMarkdown, getRichTextPlainText } from "./index";
const text = (value: string) => ({ type: "text", text: value });
it("keeps editable CMS headings and paragraphs readable in a local Markdown document", () => {
  const saved = JSON.stringify({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [text("Competitors")] },
      { type: "paragraph", content: [text("Not known yet.")] },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [text("Add a link")] }],
          },
        ],
      },
    ],
  });
  expect(getRichTextMarkdown(saved)).toBe(
    "## Competitors\n\nNot known yet.\n\n- Add a link",
  );
  expect(getRichTextPlainText(saved)).toBe(
    "Competitors\n\nNot known yet.\n\nAdd a link",
  );
  expect(getRichTextMarkdown("## Existing notes")).toBe("## Existing notes");
});
