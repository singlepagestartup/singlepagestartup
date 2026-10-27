interface IRichTextNode {
  type?: string;
  text?: string;
  attrs?: { level?: number; start?: number; href?: string; alt?: string };
  marks?: { type?: string; attrs?: { href?: string } }[];
  content?: IRichTextNode[];
}
function read(value: string): IRichTextNode | undefined {
  try {
    const node = JSON.parse(value);
    return node && node.type === "doc" && Array.isArray(node.content)
      ? node
      : undefined;
  } catch {
    return undefined;
  }
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
