import SHA256 from "crypto-js/sha256.js";
import { parse, stringify } from "yaml";

export type DocumentLayer = "singlepage" | "startup";

export interface IDocumentConfirmation {
  confirmed: boolean;
  state: "confirmed" | "unconfirmed" | "changed" | "stale";
  layer: DocumentLayer;
  by?: string;
  at?: string;
  reason?: string;
  sources?: string[];
  /**
   * The document's own state before stale upstream inputs overrode it. A
   * `changed` stamp survives here so a reader is not told to review inputs
   * when the body itself left its approval behind.
   */
  underlying?: "confirmed" | "unconfirmed" | "changed";
}

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
    const { confirmation, review, ...body } = data;
    const metadata = {
      ...(confirmation === undefined ? {} : { confirmation }),
      ...(review === undefined ? {} : { review }),
    };
    return parseDocument(renderDocument({ body: stringify(body), metadata }));
  }
  const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { body: source, metadata: {} };
  const metadata = parse(match[1]) ?? {};
  if (!record(metadata)) throw new Error("Document metadata must be an object");
  if (metadata.confirmation !== undefined) {
    const confirmation = metadata.confirmation;
    if (!record(confirmation) || typeof confirmation.confirmed !== "boolean") {
      throw new Error("confirmation.confirmed must be true or false");
    }
    for (const key of ["by", "at", "content_sha256"]) {
      if (
        confirmation[key] !== undefined &&
        typeof confirmation[key] !== "string"
      ) {
        throw new Error(`confirmation.${key} must be a string`);
      }
    }
  }
  if (metadata.review !== undefined) {
    const review = metadata.review;
    if (!record(review)) throw new Error("review must be an object");
    if (
      review.dependencies !== undefined &&
      (!record(review.dependencies) ||
        Object.values(review.dependencies).some(
          (value) => typeof value !== "string",
        ))
    ) {
      throw new Error(
        "review.dependencies must map document IDs to fingerprints",
      );
    }
    if (
      review.stale !== undefined &&
      (!record(review.stale) ||
        typeof review.stale.reason !== "string" ||
        !review.stale.reason.trim() ||
        !Array.isArray(review.stale.sources) ||
        !review.stale.sources.length ||
        review.stale.sources.some(
          (source) => typeof source !== "string" || !source.trim(),
        ))
    ) {
      throw new Error("review.stale requires a reason and source document IDs");
    }
  }
  return { body: source.slice(match[0].length), metadata };
}

export function renderDocument({ body, metadata }: IDocumentSource): string {
  if (!Object.keys(metadata).length) return body;
  return `---\n${stringify(metadata).trimEnd()}\n---\n\n${body.trim()}\n`;
}

export function documentFingerprint(
  source: string,
  format: "markdown" | "yaml" = "markdown",
): string {
  const body = parseDocument(source, format).body.replace(/\r\n/g, "\n").trim();
  return SHA256(body).toString();
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

export function documentConfirmation(
  source: string,
  layer: DocumentLayer,
  format: "markdown" | "yaml" = "markdown",
): IDocumentConfirmation {
  const { body, metadata } = parseDocument(source, format);
  const confirmation = metadata.confirmation as
    | Record<string, unknown>
    | undefined;
  const stale = (
    metadata.review as
      | { stale?: { reason: string; sources: string[] } }
      | undefined
  )?.stale;
  if (stale) return { confirmed: false, state: "stale", layer, ...stale };
  if (!confirmation?.confirmed) {
    return { confirmed: false, state: "unconfirmed", layer };
  }
  const by = typeof confirmation.by === "string" ? confirmation.by : undefined;
  const at = typeof confirmation.at === "string" ? confirmation.at : undefined;
  const confirmed = Boolean(
    (format === "yaml" ? body.trim() : hasMarkdownContent(body)) &&
      by?.trim() &&
      at?.trim() &&
      confirmation.content_sha256 === documentFingerprint(source, format),
  );
  return {
    confirmed,
    state: confirmed ? "confirmed" : "changed",
    layer,
    by,
    at,
  };
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
