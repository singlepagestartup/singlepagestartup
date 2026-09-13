import { parseDocument } from "../workspace/document";
import type { DocumentLayer } from "../workspace/document";

export interface IResearchFindingIdentity {
  id: string;
  layer: DocumentLayer;
  productPrefix: string;
  number: string;
}

export interface IResearchFindingDocument {
  layer: DocumentLayer;
  productId: string;
  sourcePath: string;
  source: string;
}

export interface IResearchFindingDeclaration extends IResearchFindingIdentity {
  productId: string;
  sourcePath: string;
  line: number;
}

/** The document's finding_prefix maps a short ID to its catalog product. */
export function parseResearchFindingId(id: string): IResearchFindingIdentity {
  const match = id.match(/^([A-Z][A-Z0-9]*)-(SPS|S)-(\d{2,})$/);
  if (!match)
    throw new Error(
      `Malformed research finding ID "${id}"; expected <product-prefix>-<SPS|S>-<two-or-more digit number>`,
    );
  return {
    id,
    productPrefix: match[1],
    layer: match[2] === "SPS" ? "singlepage" : "startup",
    number: match[3],
  };
}

/** Ignore illustrative code and comments, retaining body-relative line numbers. */
function researchLines(body: string): string[] {
  const lines = body
    .replace(/<!--[^]*?(?:-->|$)/g, (comment) => comment.replace(/[^\n]/g, " "))
    .split(/\r?\n/);
  let fence: { character: string; length: number } | undefined;
  return lines.map((line) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (
        marker &&
        marker[1][0] === fence.character &&
        marker[1].length >= fence.length &&
        !marker[2].trim()
      )
        fence = undefined;
      return "";
    }
    if (marker) {
      fence = { character: marker[1][0], length: marker[1].length };
      return "";
    }
    return line;
  });
}

function validateMetadataReferences(value: unknown, path: string): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      validateMetadataReferences(child, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === "finding_ids") {
      if (!Array.isArray(child) || child.some((id) => typeof id !== "string"))
        throw new Error(`${path}.finding_ids must be an array of finding IDs`);
      child.forEach((id) => parseResearchFindingId(id));
    } else validateMetadataReferences(child, `${path}.${key}`);
  }
}

/**
 * Check identities rather than count mentions: repeated citations are valid,
 * while each bold finding declaration has one owning layer and product.
 */
export function validateResearchFindingIds(
  documents: readonly IResearchFindingDocument[],
): IResearchFindingDeclaration[] {
  const declarations = new Map<string, IResearchFindingDeclaration>();
  const owners = new Map<string, string>();
  const productPrefixes = new Map<string, string>();
  const parsed = documents.map((document) => {
    const { body, metadata } = parseDocument(document.source);
    const prefix = metadata.finding_prefix;
    if (typeof prefix !== "string" || !/^[A-Z][A-Z0-9]*$/.test(prefix))
      throw new Error(
        `${document.sourcePath}.finding_prefix must be an uppercase product prefix, such as EX`,
      );
    const prefixKey = `${document.layer}:${prefix}`;
    const previousOwner = owners.get(prefixKey);
    if (previousOwner && previousOwner !== document.productId)
      throw new Error(
        `Duplicate research finding prefix ${prefix} in ${document.layer}: ${previousOwner} and ${document.productId}`,
      );
    owners.set(prefixKey, document.productId);
    const productKey = `${document.layer}:${document.productId}`;
    const previousPrefix = productPrefixes.get(productKey);
    if (previousPrefix && previousPrefix !== prefix)
      throw new Error(
        `${productKey} has inconsistent finding_prefix values: ${previousPrefix} and ${prefix}`,
      );
    productPrefixes.set(productKey, prefix);
    validateMetadataReferences(metadata, document.sourcePath);
    return { document, prefix, lines: researchLines(body) };
  });
  const prefixes = [...new Set(productPrefixes.values())];
  const knownDeclaration = prefixes.length
    ? new RegExp(`^(?:${prefixes.join("|")})-`)
    : undefined;
  const unqualifiedReferences = prefixes.length
    ? new RegExp(
        `(?<![\\w.-])(?:${prefixes.join("|")})-\\d+[\\w.\\u2013-]*`,
        "g",
      )
    : undefined;
  for (const { document, prefix, lines } of parsed) {
    lines.forEach((line, index) => {
      const label = line.match(
        /^\s*(?:[-+*]\s+|\|\s*|#{1,6}\s+)?\*\*([^*]+)\*\*/,
      )?.[1];
      if (label) {
        const id = label.split(/\s|[—:]/, 1)[0];
        if (
          /^(?:singlepage|startup|default)\./.test(id) ||
          /^[A-Z][A-Z0-9]*-(?:SPS|S)-/.test(id) ||
          knownDeclaration?.test(id)
        ) {
          const identity = parseResearchFindingId(id);
          if (
            identity.layer !== document.layer ||
            identity.productPrefix !== prefix
          )
            throw new Error(
              `${document.sourcePath}:${index + 1} declares ${id} outside its owner ${document.layer}/${document.productId} (finding_prefix: ${prefix})`,
            );
          const previous = declarations.get(id);
          if (previous)
            throw new Error(
              `Duplicate research finding ${id}: ${previous.sourcePath}:${previous.line} and ${document.sourcePath}:${index + 1}`,
            );
          declarations.set(id, {
            ...identity,
            productId: document.productId,
            sourcePath: document.sourcePath,
            line: index + 1,
          });
        }
      }
    });
    for (const line of lines) {
      for (const match of line.matchAll(
        /(?<![\w.-])(?:singlepage|startup|default)\.[A-Za-z0-9_-]+\.[A-Z][A-Z0-9]*-[\w.\u2013-]+/g,
      ))
        parseResearchFindingId(match[0].replace(/\.+$/, ""));
      for (const match of line.matchAll(
        /(?<![\w.-])[A-Z][A-Z0-9]*-(?:SPS|S)-[\w.\u2013-]+/g,
      ))
        parseResearchFindingId(match[0].replace(/\.+$/, ""));
      if (unqualifiedReferences)
        for (const match of line.matchAll(unqualifiedReferences))
          parseResearchFindingId(match[0].replace(/\.+$/, ""));
    }
  }
  return [...declarations.values()];
}
