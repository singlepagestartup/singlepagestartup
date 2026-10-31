/** These transformations describe the Metadata generation flow only. */
interface IRichTextNode {
  type?: string;
  text?: string;
  content?: IRichTextNode[];
}

function nodeText(node: IRichTextNode): string {
  if (!node || typeof node !== "object") return "";
  if (typeof node.text === "string") return node.text;
  if (node.type === "hardBreak") return " ";
  const content = Array.isArray(node.content)
    ? node.content.map(nodeText).join("")
    : "";
  return ["paragraph", "heading", "listItem", "codeBlock"].includes(
    node.type || "",
  )
    ? `${content} `
    : content;
}

export function plainText(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  let text = value;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      text = nodeText(parsed as IRichTextNode);
    }
  } catch {
    // Plain strings and legacy HTML descriptions are also stored by the CMS.
  }
  text = text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(x[\da-f]+|\d+);/gi, (match, code: string) => {
      const number =
        code[0].toLowerCase() === "x"
          ? parseInt(code.slice(1), 16)
          : parseInt(code, 10);
      return number > 0 &&
        number <= 0x10ffff &&
        !(number >= 0xd800 && number <= 0xdfff)
        ? String.fromCodePoint(number)
        : match;
    })
    .replace(
      /&(nbsp|amp|lt|gt|quot|apos);/gi,
      (_, entity: string) =>
        ({ nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[
          entity.toLowerCase()
        ] || "",
    )
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

export function descriptionExcerpt(value?: string | null): string | undefined {
  const text = plainText(value);
  if (!text || text.length <= 240) return text;
  const shortened = text.slice(0, 237);
  const boundary = shortened.lastIndexOf(" ");
  return `${boundary > 180 ? shortened.slice(0, boundary) : shortened}…`;
}

export function meaningfulPageText(
  value: string | null | undefined,
  placeholder: "Page" | "Description",
): string | undefined {
  const text = plainText(value);
  return text?.toLowerCase() === placeholder.toLowerCase() ? undefined : text;
}

export function absoluteHttpUrl(
  value: string | null | undefined,
  base: string,
): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value, base);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function decodeRouteValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Missing public content uses the API error contract; Next adapts HTTP 404. */
export function notFound(): never {
  throw new Error("Not Found error. Public page not found");
}
