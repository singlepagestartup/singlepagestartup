import {
  getRichTextEditorValue,
  getRichTextMarkdown,
  getRichTextPlainText,
} from "./index";
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

it.each(['["API","SDK"]', '{"product":"SPS"}'])(
  "opens %s as literal text in the editor",
  (saved) => {
    expect(JSON.parse(getRichTextEditorValue(saved))).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [text(saved)] }],
    });
  },
);

it("opens saved nodes and node arrays in an editable document", () => {
  const heading = {
    type: "heading",
    attrs: { level: 2 },
    content: [text("Start")],
  };
  const markedText = { ...text("Set up"), marks: [{ type: "bold" }] };

  expect(JSON.parse(getRichTextEditorValue(JSON.stringify(heading)))).toEqual({
    type: "doc",
    content: [heading],
  });
  expect(
    JSON.parse(getRichTextEditorValue(JSON.stringify([heading, markedText]))),
  ).toEqual({
    type: "doc",
    content: [heading, { type: "paragraph", content: [markedText] }],
  });
});
