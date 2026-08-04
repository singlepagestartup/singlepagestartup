import { parse, stringify } from "yaml";

export interface IMergedWorkspaceContent {
  content: string;
  overlayContributes: boolean;
}

export type WorkspaceMergeStrategy =
  | "keyed"
  | "replace"
  | "scoped-keyed"
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

export function mergeMarkdown(
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

export function mergeEvidenceRegister(
  base: string,
  overlay: string,
): IMergedWorkspaceContent {
  function table(source: string) {
    const lines = source.split("\n");
    const start = lines.findIndex((line) => line.trimStart().startsWith("|"));
    if (start < 0) return undefined;
    let end = start;
    while (end < lines.length && lines[end].trimStart().startsWith("|")) {
      end += 1;
    }
    return {
      after: lines.slice(end).join("\n").trim(),
      before: lines.slice(0, start).join("\n").trim(),
      header: lines.slice(start, Math.min(start + 2, end)),
      rows: lines.slice(Math.min(start + 2, end), end),
    };
  }

  const baseTable = table(base);
  const overlayTable = table(overlay);
  if (!baseTable || !overlayTable) return mergeMarkdown(base, overlay);
  const overlayRows = overlayTable.rows.filter((row) => row.trim());
  if (!overlayRows.length) return { content: base, overlayContributes: false };

  function rowId(row: string) {
    return row.split("|")[1]?.trim() ?? row;
  }

  const rows = new Map(
    baseTable.rows.filter((row) => row.trim()).map((row) => [rowId(row), row]),
  );
  for (const row of overlayRows) rows.set(rowId(row), row);
  const content = [
    baseTable.before || overlayTable.before,
    ...baseTable.header,
    ...rows.values(),
    overlayTable.after || baseTable.after,
  ]
    .filter(Boolean)
    .join("\n");
  return { content: `${content}\n`, overlayContributes: true };
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
  const baseData = parse(base);
  const overlayData = parse(overlay);
  const merged = mergeData(baseData, overlayData);
  const overlayContributes =
    JSON.stringify(merged) !== JSON.stringify(baseData);
  return {
    content: overlayContributes ? stringify(merged) : base,
    overlayContributes,
  };
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
    return hasMeaningfulMarkdown(overlay)
      ? { content: overlay, overlayContributes: true }
      : { content: base, overlayContributes: false };
  }
  if (strategy === "keyed") return mergeYaml(base, overlay);
  if (strategy === "scoped-keyed") {
    return mergeEvidenceRegister(base, overlay);
  }
  if (strategy === "sections") return mergeMarkdown(base, overlay);
  if (sourcePath.endsWith(".yaml")) return mergeYaml(base, overlay);
  if (kind === "evidence") return mergeEvidenceRegister(base, overlay);
  return mergeMarkdown(base, overlay);
}
