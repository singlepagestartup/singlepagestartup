import { z } from "zod";
import type { IModel as IArticle } from "@sps/blog/models/article/sdk/model";
import type { IAuthorSummary } from "@sps/social/models/profile/sdk/model";
export interface IArticleCreateInput {
  requestId: string;
  title: Partial<Record<"en" | "ru", string>>;
  subtitle?: Partial<Record<"en" | "ru", string>>;
  description: Partial<Record<"en" | "ru", string>>;
  categoryId?: string;
}
export interface IArticleCreateResult {
  article: IArticle;
  author: IAuthorSummary;
}
const uuid = z.string().uuid();
function invalid(message: string): never {
  throw new Error(`Validation error. ${message}`);
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function exact(value: Record<string, unknown>, fields: string[]) {
  if (Object.keys(value).some((key) => !fields.includes(key)))
    invalid("Unsupported Article data field");
}
function richText(value: string, subtitle: boolean): string {
  if (value.length > (subtitle ? 20000 : 100000))
    invalid("Article text is too large");
  let document: unknown;
  try {
    document = JSON.parse(value);
  } catch {
    invalid("Article rich text must be serialized TipTap JSON");
  }
  let nodes = 0;
  let visible = "";
  const visit = (node: unknown, depth: number) => {
    if (++nodes > 5000 || depth > 20 || !record(node))
      invalid("Invalid or excessive Article rich text");
    exact(node, ["type", "content", "text", "marks", "attrs"]);
    if (
      ![
        "doc",
        "paragraph",
        "text",
        "heading",
        "bulletList",
        "orderedList",
        "listItem",
        "blockquote",
        "codeBlock",
        "hardBreak",
        "horizontalRule",
      ].includes(String(node.type))
    )
      invalid("Unsupported Article rich text node");
    if (depth === 0 && node.type !== "doc")
      invalid("Article rich text must be a document");
    if (node.type === "doc" && depth !== 0)
      invalid("Nested rich text documents are unsupported");
    if (node.text !== undefined) {
      if (node.type !== "text" || typeof node.text !== "string")
        invalid("Invalid Article text node");
      visible += node.text;
    }
    if (node.attrs !== undefined) {
      if (!record(node.attrs)) invalid("Invalid Article node attributes");
      const attributes = node.attrs;
      if (node.type === "heading") {
        exact(attributes, ["level"]);
        if (
          !Number.isInteger(attributes.level) ||
          Number(attributes.level) < 1 ||
          Number(attributes.level) > 6
        )
          invalid("Invalid heading level");
      } else if (node.type === "orderedList") {
        exact(attributes, ["start"]);
        if (
          !Number.isSafeInteger(attributes.start) ||
          Number(attributes.start) < 1
        )
          invalid("Invalid ordered list start");
      } else if (node.type === "codeBlock") {
        exact(attributes, ["language"]);
        if (
          attributes.language !== null &&
          (typeof attributes.language !== "string" ||
            !/^[a-z0-9_+-]{0,40}$/i.test(attributes.language))
        )
          invalid("Invalid code language");
      } else if (Object.keys(attributes).length)
        invalid("Unsupported Article node attributes");
    }
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks) || node.marks.length > 10)
        invalid("Invalid Article marks");
      for (const mark of node.marks) {
        if (!record(mark)) invalid("Invalid Article mark");
        exact(mark, ["type", "attrs"]);
        if (
          !["bold", "italic", "strike", "underline", "code", "link"].includes(
            String(mark.type),
          )
        )
          invalid("Unsupported Article mark");
        if (mark.type === "link") {
          if (!record(mark.attrs)) invalid("Invalid Article link");
          exact(mark.attrs, ["href", "target", "rel", "class"]);
          const href = mark.attrs.href;
          if (
            typeof href !== "string" ||
            !/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href) ||
            /[\u0000-\u0020\u007f]/.test(href)
          )
            invalid("Unsafe Article link");
          if (
            mark.attrs.target !== undefined &&
            mark.attrs.target !== null &&
            !["_blank", "_self"].includes(String(mark.attrs.target))
          )
            invalid("Unsafe Article link target");
          for (const key of ["rel", "class"])
            if (
              mark.attrs[key] !== undefined &&
              mark.attrs[key] !== null &&
              (typeof mark.attrs[key] !== "string" ||
                String(mark.attrs[key]).length > 100)
            )
              invalid("Invalid Article link metadata");
        } else if (
          mark.attrs !== undefined &&
          (!record(mark.attrs) || Object.keys(mark.attrs).length)
        )
          invalid("Unsupported Article mark attributes");
      }
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content) || node.type === "text")
        invalid("Invalid Article node content");
      node.content.forEach((child) => visit(child, depth + 1));
    }
  };
  visit(document, 0);
  if (!visible.trim()) return "";
  if (subtitle && visible.length > 500) invalid("Article summary is too long");
  return JSON.stringify(document);
}
function localeMap(value: unknown, kind: "title" | "subtitle" | "description") {
  if (!record(value)) invalid("Article localized text must be an object");
  exact(value, ["en", "ru"]);
  const result: Partial<Record<"en" | "ru", string>> = {};
  for (const locale of ["en", "ru"] as const) {
    const text = value[locale];
    if (text === undefined || text === "") continue;
    if (typeof text !== "string")
      invalid("Article localized values must be strings");
    const trimmed = text.trim();
    if (!trimmed) continue;
    if (kind === "title") {
      if (trimmed.length > 160 || /[<>\u0000-\u001f]/.test(trimmed))
        invalid("Invalid Article title");
      result[locale] = trimmed;
    } else {
      const rich = richText(trimmed, kind === "subtitle");
      if (rich) result[locale] = rich;
    }
  }
  return result;
}
export function parseArticleCreateInput(value: unknown): IArticleCreateInput {
  if (!record(value)) invalid("Invalid Article creation payload");
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 256 * 1024)
    invalid("Article creation payload is too large");
  exact(value, ["requestId", "title", "subtitle", "description", "categoryId"]);
  const requestId = uuid.parse(value.requestId).toLowerCase();
  const title = localeMap(value.title, "title");
  const description = localeMap(value.description, "description");
  const subtitle =
    value.subtitle === undefined ? {} : localeMap(value.subtitle, "subtitle");
  if (!Object.keys(title).length)
    invalid("Article title and body are required");
  for (const locale of ["en", "ru"] as const)
    if (
      !!title[locale] !== !!description[locale] ||
      (subtitle[locale] && !title[locale])
    )
      invalid("Each Article locale needs both title and body");
  return {
    requestId,
    title,
    description,
    ...(Object.keys(subtitle).length ? { subtitle } : {}),
    ...(value.categoryId !== undefined
      ? { categoryId: uuid.parse(value.categoryId).toLowerCase() }
      : {}),
  };
}
export const articleCreateSchema = z.unknown().transform((value, context) => {
  try {
    return parseArticleCreateInput(value);
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid Article creation payload",
    });
    return z.NEVER;
  }
});
