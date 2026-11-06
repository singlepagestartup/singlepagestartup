import {
  articleCreateSchema,
  parseArticleCreateInput,
} from "./blog-article-create";

const document = (text: string) =>
  JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });
const input = () => ({
  requestId: "61ed455d-8cce-458f-9992-a12e1fcb449a",
  title: { en: " SDK boundaries " },
  subtitle: { en: document("A short summary") },
  description: { en: document("A complete article") },
});

it("normalizes locale entries and keeps a durable request UUID", () => {
  const data = input();
  expect(
    parseArticleCreateInput({
      ...data,
      title: { ru: "", ...data.title },
      description: { ...data.description, ru: document(" ") },
    }),
  ).toEqual({ ...data, title: { en: "SDK boundaries" } });
});

it.each([
  "profileId",
  "subjectId",
  "author",
  "variant",
  "slug",
  "adminTitle",
  "id",
])("rejects caller-controlled %s", (key) => {
  expect(
    articleCreateSchema.safeParse({ ...input(), [key]: "forged" }).success,
  ).toBe(false);
});

it("requires matching nonempty title/body locales", () => {
  expect(
    articleCreateSchema.safeParse({
      ...input(),
      title: { en: "Title", ru: "Other" },
    }).success,
  ).toBe(false);
  expect(
    articleCreateSchema.safeParse({
      ...input(),
      description: { en: document(" ") },
    }).success,
  ).toBe(false);
});

it("allows code blocks and rejects executable links, HTML and excessive nesting", () => {
  const data = input();
  const code = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "codeBlock",
        attrs: { language: "typescript" },
        content: [{ type: "text", text: "const count = 1;" }],
      },
    ],
  });
  expect(
    articleCreateSchema.safeParse({ ...data, description: { en: code } })
      .success,
  ).toBe(true);
  const unsafe = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Click",
            marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
          },
        ],
      },
    ],
  });
  expect(
    articleCreateSchema.safeParse({ ...data, description: { en: unsafe } })
      .success,
  ).toBe(false);
  expect(
    articleCreateSchema.safeParse({
      ...data,
      description: { en: "<script>alert(1)</script>" },
    }).success,
  ).toBe(false);
  let nested: object = { type: "text", text: "Body" };
  for (let index = 0; index < 25; index++)
    nested = { type: "blockquote", content: [nested] };
  expect(
    articleCreateSchema.safeParse({
      ...data,
      description: { en: JSON.stringify({ type: "doc", content: [nested] }) },
    }).success,
  ).toBe(false);
});
