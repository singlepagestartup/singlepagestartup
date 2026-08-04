import type { IProjectDesignData } from "../ProjectDesign";
import type { IStudioWorkspace } from "../types";

export type ProjectDesignProjection = "current" | "singlepage" | "startup";

function artifact(workspace: IStudioWorkspace, kind: string): string {
  return (
    workspace.artifacts.find((candidate) => candidate.kind === kind)?.content ??
    ""
  );
}

function meaningfulMarkdown(value: string): boolean {
  return Boolean(
    value
      .replace(/^---[\s\S]*?^---\s*/m, "")
      .replace(/^#{1,6}\s+.*$/gm, "")
      .replace(/<!--([\s\S]*?)-->/g, "")
      .trim(),
  );
}

function clean(value: string): string {
  return value
    .replace(/^[-*]\s+/, "")
    .replace(/`/g, "")
    .replace(/\s+\[[^\]]+\]\s*$/, "")
    .trim();
}

function valueFor(source: string, labels: string[], fallback: string): string {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = source.match(
      new RegExp(`^\\s*(?:[-*]\\s+)?${escaped}\\s*:\\s*(.+)$`, "im"),
    );
    if (match?.[1]) return clean(match[1]);
  }
  return fallback;
}

function colorFor(source: string, labels: string[], fallback: string): string {
  const value = valueFor(source, labels, "");
  return value.match(/#[0-9a-f]{6}\b/i)?.[0] ?? fallback;
}

function sectionLines(source: string, terms: string[]): string[] {
  const sections = [...source.matchAll(/^##\s+(.+)$/gm)];
  for (let index = 0; index < sections.length; index += 1) {
    const heading = sections[index][1].toLocaleLowerCase();
    if (!terms.some((term) => heading.includes(term))) continue;
    const start = (sections[index].index ?? 0) + sections[index][0].length;
    const end = sections[index + 1]?.index ?? source.length;
    return source
      .slice(start, end)
      .split("\n")
      .map(clean)
      .filter((line) => line && !line.startsWith("#"))
      .slice(0, 5);
  }
  return [];
}

function assetIds(source: string): string[] {
  return [...source.matchAll(/^\s*-?\s*id:\s*['"]?([^'"\n]+)['"]?\s*$/gm)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

const projectionLabels: Record<ProjectDesignProjection, string> = {
  current: "current",
  singlepage: "singlepage",
  startup: "startup",
};

export function projectDesignData(
  workspace: IStudioWorkspace,
  projection: ProjectDesignProjection,
): IProjectDesignData {
  const brand = artifact(workspace, "brand");
  const website = artifact(workspace, "website");
  const assets = artifact(workspace, "asset-index");

  return {
    assetIds: assetIds(assets),
    bodyType: valueFor(
      brand,
      ["Body type", "Body font", "Основной шрифт"],
      "ui-sans-serif, system-ui, sans-serif",
    ),
    brandReady: meaningfulMarkdown(brand),
    cta: valueFor(
      website,
      ["Primary CTA", "CTA", "Основной призыв"],
      "Define the primary action in website.md",
    ),
    displayType: valueFor(
      brand,
      ["Display type", "Display font", "Акцентный шрифт"],
      "ui-serif, Georgia, serif",
    ),
    headline: valueFor(
      website,
      ["Headline", "Заголовок"],
      "Define the final headline in website.md",
    ),
    name: valueFor(
      brand,
      ["Brand name", "Name", "Название бренда"],
      projection === "startup" ? "Startup" : "SinglePageStartup",
    ),
    palette: {
      accent: colorFor(brand, ["Accent", "Акцентный"], "#0f766e"),
      background: colorFor(brand, ["Background", "Paper", "Фон"], "#f8fafc"),
      foreground: colorFor(
        brand,
        ["Foreground", "Ink", "Text", "Текст"],
        "#0f172a",
      ),
      line: colorFor(brand, ["Line", "Border", "Граница"], "#cbd5e1"),
      muted: colorFor(brand, ["Muted", "Вторичный текст"], "#64748b"),
      primary: colorFor(brand, ["Primary", "Основной"], "#0f172a"),
    },
    projection,
    projectionLabel: projectionLabels[projection],
    sections: {
      communication: sectionLines(brand, [
        "communication",
        "message",
        "коммуника",
      ]),
      identity: sectionLines(brand, [
        "identity",
        "visual",
        "brand idea",
        "иденти",
      ]),
      page: sectionLines(website, [
        "page",
        "section",
        "visitor",
        "страниц",
        "путь",
      ]),
    },
    subheadline: valueFor(
      website,
      ["Subheadline", "Подзаголовок"],
      "The selected website specification will provide the supporting message.",
    ),
    successCopy: valueFor(
      website,
      ["Success copy", "Success message", "Текст успешной отправки"],
      "Define what happens next after conversion in website.md.",
    ),
    successTitle: valueFor(
      website,
      ["Success title", "Заголовок успешной отправки"],
      "Define the success state in website.md",
    ),
    websiteReady: meaningfulMarkdown(website),
  };
}
