import { parse, stringify } from "yaml";

export type DocumentLayer = "singlepage" | "startup";

export interface IDocumentSource {
  body: string;
  metadata: Record<string, unknown>;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function parseDocument(
  source: string,
  format: "markdown" | "yaml" = "markdown",
): IDocumentSource {
  if (format === "yaml") {
    const data = parse(source) ?? {};
    if (!record(data)) throw new Error("Document YAML must be an object");
    return { body: stringify(data), metadata: {} };
  }
  const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { body: source, metadata: {} };
  const metadata = parse(match[1]) ?? {};
  if (!record(metadata)) throw new Error("Document metadata must be an object");
  return { body: source.slice(match[0].length), metadata };
}

export function renderDocument({ body, metadata }: IDocumentSource): string {
  if (!Object.keys(metadata).length) return body;
  return `---\n${stringify(metadata).trimEnd()}\n---\n\n${body.trim()}\n`;
}

/** Advance once through whitespace and comments; an unclosed comment hides the rest. */
function skipDocumentTrivia(body: string, offset = 0): number {
  while (offset < body.length) {
    if (/\s/.test(body[offset])) {
      offset++;
      continue;
    }
    if (!body.startsWith("<!--", offset)) break;
    const end = body.indexOf("-->", offset + 4);
    if (end === -1) return body.length;
    offset = end + 3;
  }
  return offset;
}

function documentLineEnd(body: string, offset: number): number {
  while (
    offset < body.length &&
    body[offset] !== "\r" &&
    body[offset] !== "\n"
  ) {
    offset++;
  }
  return offset;
}

/** A content-presence check, not HTML sanitization; never returns rewritten text. */
export function hasMarkdownContent(body: string): boolean {
  let offset = 0;
  while (offset < body.length) {
    offset = skipDocumentTrivia(body, offset);
    if (offset === body.length) return false;
    const lineStart = offset === 0 || /[\r\n]/.test(body[offset - 1]);
    let markerEnd = offset;
    while (body[markerEnd] === "#" && markerEnd - offset < 7) markerEnd++;
    const markerCount = markerEnd - offset;
    if (
      lineStart &&
      markerCount >= 1 &&
      markerCount <= 6 &&
      (markerEnd === body.length || /[ \t\r\n]/.test(body[markerEnd]))
    ) {
      offset = documentLineEnd(body, markerEnd);
      continue;
    }
    return true;
  }
  return false;
}

/** Remove only the document title; keep every section and nested heading. */
export function documentReviewBody(source: string, hideTitle = false): string {
  const body = parseDocument(source).body;
  if (!hideTitle) return body;
  const titleStart = skipDocumentTrivia(body);
  if (!body.startsWith("# ", titleStart)) return body.trimStart();
  const titleEnd = documentLineEnd(body, titleStart + 2);
  if (titleEnd === titleStart + 2) return body.trimStart();
  let contentStart = titleEnd;
  if (body[contentStart] === "\r") contentStart++;
  if (body[contentStart] === "\n") contentStart++;
  return (body.slice(0, titleStart) + body.slice(contentStart)).trimStart();
}
