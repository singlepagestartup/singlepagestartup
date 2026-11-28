interface IRichTextNode {
  type?: string;
  text?: string;
  attrs?: { level?: number; start?: number; href?: string; alt?: string };
  marks?: { type: string; attrs?: { href?: string } }[];
  content?: IRichTextNode[];
}

const inlineNodeTypes = new Set(["text", "hardBreak", "copyButton"]);
const blockNodeTypes = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "image",
]);

function isRichTextNode(value: unknown): value is IRichTextNode {
  if (!value || typeof value !== "object") return false;
  const node = value as IRichTextNode;
  if (typeof node.type !== "string") return false;
  if (node.type === "text") return typeof node.text === "string";
  return (
    inlineNodeTypes.has(node.type) ||
    blockNodeTypes.has(node.type) ||
    Array.isArray(node.content)
  );
}

export function readRichTextContent(
  value: string,
): IRichTextNode | IRichTextNode[] | undefined {
  const firstCharacter = value.trimStart()[0];
  if (firstCharacter !== "{" && firstCharacter !== "[") return undefined;

  try {
    const parsed: unknown = JSON.parse(value);
    if (isRichTextNode(parsed)) return parsed;
    return Array.isArray(parsed) && parsed.every(isRichTextNode)
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

function read(value: string): IRichTextNode | undefined {
  const node = readRichTextContent(value);
  return node &&
    !Array.isArray(node) &&
    node.type === "doc" &&
    Array.isArray(node.content)
    ? node
    : undefined;
}
function plain(node: IRichTextNode): string {
  if (node.type === "hardBreak") return "\n";
  if (node.type === "image") return node.attrs?.alt || "";
  if (node.text !== undefined) return node.text;
  const children = (node.content || []).map(plain);
  return children.join(
    ["doc", "bulletList", "orderedList", "listItem"].includes(node.type || "")
      ? "\n\n"
      : "",
  );
}
function markdown(node: IRichTextNode): string {
  if (node.type === "text") {
    return (node.marks || []).reduce((text, mark) => {
      if (mark.type === "bold") return `**${text}**`;
      if (mark.type === "italic") return `_${text}_`;
      if (mark.type === "strike") return `~~${text}~~`;
      if (mark.type === "code") return `\`${text}\``;
      if (
        mark.type === "link" &&
        /^(https?:\/\/|\/|#|mailto:)/i.test(mark.attrs?.href || "")
      )
        return `[${text}](${mark.attrs!.href})`;
      return text;
    }, node.text || "");
  }
  if (node.type === "hardBreak") return "\n";
  if (node.type === "image") return node.attrs?.alt || "";
  if (node.type === "horizontalRule") return "---";
  if (node.type === "codeBlock") return `\`\`\`\n${plain(node)}\n\`\`\``;
  const children = node.content || [];
  if (node.type === "bulletList" || node.type === "orderedList") {
    return children
      .map(
        (item, index) =>
          `${node.type === "bulletList" ? "-" : `${(node.attrs?.start || 1) + index}.`} ${markdown(item).replace(/\n/g, "\n  ")}`,
      )
      .join("\n");
  }
  const text = children
    .map(markdown)
    .join(
      ["doc", "listItem", "blockquote"].includes(node.type || "") ? "\n\n" : "",
    );
  if (node.type === "heading")
    return `${"#".repeat(Math.max(1, Math.min(6, node.attrs?.level || 2)))} ${text}`;
  if (node.type === "blockquote")
    return text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  return text;
}
/** CMS fields can contain legacy plain text or the admin editor's TipTap JSON. */
export function getRichTextEditorValue(value: string): string {
  if (!value) return value;
  const saved = readRichTextContent(value);
  if (saved) {
    if (!Array.isArray(saved) && saved.type === "doc") return value;
    const nodes = Array.isArray(saved) ? saved : [saved];
    const content: IRichTextNode[] = [];
    let inline: IRichTextNode[] = [];
    for (const node of nodes) {
      if (node.type && inlineNodeTypes.has(node.type)) {
        inline.push(node);
        continue;
      }
      if (inline.length) content.push({ type: "paragraph", content: inline });
      inline = [];
      content.push(node);
    }
    if (inline.length) content.push({ type: "paragraph", content: inline });
    return JSON.stringify({ type: "doc", content });
  }

  return JSON.stringify({
    type: "doc",
    content: value.split(/\r\n|\n|\r/).map((line) => ({
      type: "paragraph",
      ...(line && { content: [{ type: "text", text: line }] }),
    })),
  });
}

export function getRichTextPlainText(value: string | undefined): string {
  if (!value) return "";
  const node = read(value);
  return node ? plain(node) : value;
}
export function getRichTextMarkdown(value: string | undefined): string {
  if (!value) return "";
  const node = read(value);
  return node ? markdown(node) : value;
}
