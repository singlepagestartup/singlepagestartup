import { parse, stringify } from "yaml";
import { parseDocument, renderDocument, type DocumentLayer } from "./document";

export interface IMergedWorkspaceContent {
  content: string;
  overlayContributes: boolean;
  confirmationLayer?: DocumentLayer;
}

export type WorkspaceMergeStrategy =
  | "keyed"
  | "product-catalog"
  | "replace"
  | "sections";

function hasMeaningfulMarkdown(value: string): boolean {
  return Boolean(
    value
      .replace(/^---[\s\S]*?^---\s*/m, "")
      .replace(/^#{1,6}\s+.*$/gm, "")
      .replace(/<!--([\s\S]*?)-->/g, "")
      .trim(),
  );
}

interface IMarkdownSection {
  body: string;
  heading: string;
  key: string;
}

function splitMarkdown(source: string): {
  head: string;
  sections: IMarkdownSection[];
} {
  const matches = [...source.matchAll(/^##\s+(.+)$/gm)];
  if (!matches.length) return { head: source.trim(), sections: [] };
  const sections = matches.map((match, index) => {
    const start = match.index ?? 0;
    const bodyStart = start + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    const heading = match[1].trim();
    return {
      body: source.slice(bodyStart, end).trim(),
      heading,
      key: heading.toLocaleLowerCase(),
    };
  });
  return {
    head: source.slice(0, matches[0].index).trim(),
    sections,
  };
}

function renderMarkdown(head: string, sections: IMarkdownSection[]): string {
  return `${[
    head.trim(),
    ...sections.map(
      (section) =>
        `## ${section.heading}${section.body ? `\n\n${section.body}` : ""}`,
    ),
  ]
    .filter(Boolean)
    .join("\n\n")}\n`;
}

function mergeMarkdownBody(
  base: string,
  overlay: string,
): IMergedWorkspaceContent {
  if (base.trim() === overlay.trim()) {
    return { content: base, overlayContributes: false };
  }
  if (!hasMeaningfulMarkdown(overlay)) {
    return { content: base, overlayContributes: false };
  }
  if (!hasMeaningfulMarkdown(base)) {
    return { content: overlay, overlayContributes: true };
  }

  const baseDocument = splitMarkdown(base);
  const overlayDocument = splitMarkdown(overlay);
  if (!baseDocument.sections.length || !overlayDocument.sections.length) {
    return { content: overlay, overlayContributes: true };
  }

  const overlayByKey = new Map(
    overlayDocument.sections.map((section) => [section.key, section]),
  );
  const consumed = new Set<string>();
  const sections = baseDocument.sections.map((baseSection) => {
    const overlaySection = overlayByKey.get(baseSection.key);
    if (!overlaySection || !hasMeaningfulMarkdown(overlaySection.body)) {
      return baseSection;
    }
    consumed.add(baseSection.key);
    return overlaySection;
  });
  for (const overlaySection of overlayDocument.sections) {
    if (
      !consumed.has(overlaySection.key) &&
      !baseDocument.sections.some(
        (baseSection) => baseSection.key === overlaySection.key,
      ) &&
      hasMeaningfulMarkdown(overlaySection.body)
    ) {
      sections.push(overlaySection);
    }
  }

  return {
    content: renderMarkdown(baseDocument.head, sections),
    overlayContributes: true,
  };
}

function mergeDocument(
  base: string,
  overlay: string,
  mergeBody: (base: string, overlay: string) => IMergedWorkspaceContent,
): IMergedWorkspaceContent {
  const baseDocument = parseDocument(base);
  const overlayDocument = parseDocument(overlay);
  const merged = mergeBody(baseDocument.body, overlayDocument.body);
  const ownsConfirmation = Object.hasOwn(
    overlayDocument.metadata,
    "confirmation",
  );
  const metadata = { ...baseDocument.metadata, ...overlayDocument.metadata };
  // A changed body never inherits approval of the previous document.
  if (
    merged.overlayContributes &&
    !ownsConfirmation &&
    baseDocument.metadata.confirmation !== undefined
  ) {
    metadata.confirmation = { confirmed: false };
  }
  if (
    merged.overlayContributes &&
    !Object.hasOwn(overlayDocument.metadata, "review")
  )
    delete metadata.review;
  return {
    content: renderDocument({ body: merged.content, metadata }),
    overlayContributes:
      merged.overlayContributes ||
      Object.keys(overlayDocument.metadata).length > 0,
    confirmationLayer:
      ownsConfirmation || merged.overlayContributes ? "startup" : "singlepage",
  };
}

export function mergeMarkdown(
  base: string,
  overlay: string,
): IMergedWorkspaceContent {
  return mergeDocument(base, overlay, mergeMarkdownBody);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mergeData(base: unknown, overlay: unknown): unknown {
  if (overlay == null || overlay === "") return base;
  if (Array.isArray(base) && Array.isArray(overlay)) {
    if (!overlay.length) return base;
    const keyed = [...base, ...overlay].every(
      (item) => isRecord(item) && typeof item.id === "string",
    );
    if (!keyed) return overlay;
    const records = new Map(
      base.map((item) => [(item as Record<string, unknown>).id, item]),
    );
    for (const item of overlay) {
      const id = (item as Record<string, unknown>).id;
      records.set(id, mergeData(records.get(id), item));
    }
    return [...records.values()];
  }
  if (isRecord(base) && isRecord(overlay)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(overlay)) {
      result[key] = mergeData(base[key], value);
    }
    return result;
  }
  return overlay;
}

export function mergeYaml(
  base: string,
  overlay: string,
): IMergedWorkspaceContent {
  const baseDocument = parseDocument(base, "yaml");
  const overlayDocument = parseDocument(overlay, "yaml");
  const baseData = parse(baseDocument.body);
  const overlayData = parse(overlayDocument.body);
  const merged = mergeData(baseData, overlayData);
  const bodyChanges = JSON.stringify(merged) !== JSON.stringify(baseData);
  const ownsConfirmation = Object.hasOwn(
    overlayDocument.metadata,
    "confirmation",
  );
  const metadata = { ...baseDocument.metadata, ...overlayDocument.metadata };
  if (
    bodyChanges &&
    !ownsConfirmation &&
    baseDocument.metadata.confirmation !== undefined
  )
    metadata.confirmation = { confirmed: false };
  if (bodyChanges && !Object.hasOwn(overlayDocument.metadata, "review"))
    delete metadata.review;
  const overlayContributes =
    bodyChanges || Object.keys(overlayDocument.metadata).length > 0;
  return {
    content: overlayContributes
      ? stringify({ ...(merged as Record<string, unknown>), ...metadata })
      : base,
    overlayContributes,
    confirmationLayer:
      bodyChanges || ownsConfirmation ? "startup" : "singlepage",
  };
}

function productCount(source: string): number {
  if (!source.trim()) return 0;
  const value = parse(source) as { products?: unknown } | null;
  return Array.isArray(value?.products) ? value.products.length : 0;
}

export function replaceProductCatalog(
  base: string,
  overlay: string,
): IMergedWorkspaceContent {
  return productCount(overlay) > 0
    ? { content: overlay, overlayContributes: true }
    : { content: base, overlayContributes: false };
}

export function mergeWorkspaceContent({
  base,
  kind,
  overlay,
  sourcePath,
  strategy,
}: {
  base: string;
  kind: string;
  overlay: string;
  sourcePath: string;
  strategy?: WorkspaceMergeStrategy;
}): IMergedWorkspaceContent {
  if (strategy === "replace") {
    return mergeDocument(base, overlay, (baseBody, overlayBody) =>
      hasMeaningfulMarkdown(overlayBody)
        ? { content: overlayBody, overlayContributes: true }
        : { content: baseBody, overlayContributes: false },
    );
  }
  if (strategy === "keyed") return mergeYaml(base, overlay);
  if (strategy === "product-catalog") {
    return replaceProductCatalog(base, overlay);
  }
  if (strategy === "sections") return mergeMarkdown(base, overlay);
  if (sourcePath.endsWith(".yaml")) return mergeYaml(base, overlay);
  return mergeMarkdown(base, overlay);
}
