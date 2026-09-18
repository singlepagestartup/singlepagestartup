import { parse } from "yaml";

import {
  hasMarkdownContent,
  parseDocument,
} from "../../../../../tools/studio/workspace/document";

import type {
  IProjectDesignAsset,
  IProjectDesignData,
  IProjectDesignInterface,
  IProjectDesignMedia,
  IProjectDesignPrompt,
  IProjectDesignTypographyRole,
} from "../components/ProjectDesign";
import type { IStudioWorkspace } from "../types";

export type ProjectDesignProjection = "singlepage" | "startup";

export interface IProjectDesignWorkspaces {
  default: IStudioWorkspace;
  singlepage: IStudioWorkspace;
  startup: IStudioWorkspace;
}

function artifact(workspace: IStudioWorkspace, kind: string): string {
  return (
    workspace.artifacts.find((candidate) => candidate.kind === kind)?.content ??
    ""
  );
}

/** A source with only frontmatter, headings and comments is not a decision. */
function meaningfulMarkdown(value: string): boolean {
  return hasMarkdownContent(parseDocument(value).body);
}

function clean(value: string): string {
  return value
    .replace(/^[-*]\s+/, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstBoldValue(value: string): string | undefined {
  return value.match(/\*\*([^*]+)\*\*/)?.[1]?.trim();
}

function section(source: string, heading: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => {
    const match = line.match(/^(#{2,4})\s+(.+?)\s*$/);
    return match?.[2].toLocaleLowerCase() === heading.toLocaleLowerCase();
  });
  if (start < 0) return "";
  const level = lines[start].match(/^(#+)/)?.[1].length ?? 2;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const nextLevel = lines[index].match(/^(#+)\s+/)?.[1].length;
    if (nextLevel != null && nextLevel <= level) {
      end = index;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
}

function sectionBullets(source: string, heading: string): string[] {
  return section(source, heading)
    .split("\n")
    .filter((line) => /^\s*[-*]\s+/.test(line))
    .map(clean)
    .filter(Boolean);
}

function sectionParagraphs(source: string, heading: string): string[] {
  return section(source, heading)
    .split(/\n\s*\n/)
    .map((block) => clean(block))
    .filter(
      (block) =>
        block &&
        !block.startsWith("|") &&
        !block.startsWith("-") &&
        !block.startsWith("#"),
    );
}

function sectionRules(source: string, heading: string): string[] {
  const bullets = sectionBullets(source, heading);
  return bullets.length ? bullets : sectionParagraphs(source, heading);
}

function sectionBlockquote(source: string, heading: string): string {
  return section(source, heading)
    .split("\n")
    .filter((line) => /^\s*>/.test(line))
    .map((line) => line.replace(/^\s*>\s?/, ""))
    .join(" ")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tableRows(source: string, heading?: string): string[][] {
  const target = heading ? section(source, heading) : source;
  return target
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map(clean))
    .filter(
      (cells) =>
        cells.length > 1 &&
        !cells.every((cell) => /^:?-{3,}:?$/.test(cell)) &&
        !["role", "field", "example", "do", "family", "pattern"].includes(
          cells[0].toLocaleLowerCase(),
        ),
    );
}

/** A section may hold several tables; the role table is its first one. */
function firstTable(source: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trim().startsWith("|"));
  if (start < 0) return "";
  let end = start;
  while (end < lines.length && lines[end].trim().startsWith("|")) end += 1;
  return lines.slice(start, end).join("\n");
}

function valueFor(source: string, labels: string[], fallback: string): string {
  const normalizedLabels = labels.map((label) => label.toLocaleLowerCase());
  for (const row of tableRows(source)) {
    if (normalizedLabels.includes(row[0].toLocaleLowerCase())) {
      return row[1] || fallback;
    }
  }
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = source.match(
      new RegExp(
        `^\\s*(?:[-*]\\s+)?(?:\\*\\*)?${escaped}\\s*:(?:\\*\\*)?\\s*(.+)$`,
        "im",
      ),
    );
    if (match?.[1]) return clean(match[1]);
  }
  return fallback;
}

function colorFor(source: string, labels: string[], fallback: string): string {
  return valueFor(source, labels, "").match(/#[0-9a-f]{6}\b/i)?.[0] ?? fallback;
}

function fontLabel(value: string, fallback: string): string {
  const normalized = clean(value);
  const beforeMetadata = normalized
    .split(/\s+(?:at|\(|with\s|\d{3}(?:\s*[–-]\s*\d{3})?\b)/i)[0]
    ?.trim();
  return beforeMetadata || fallback;
}

function fontStack(
  declaredFamily: string,
  fallback: string,
): { family: string; stack: string } {
  const declaredTokens = declaredFamily
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
  const firstToken = declaredTokens[0];

  if (!firstToken) {
    return { family: fallback, stack: fallback };
  }

  const family = firstToken.replace(/^['"]|['"]$/g, "");
  const normalizedFirstToken = /\s/.test(family) ? `"${family}"` : family;
  const declaredStack = [normalizedFirstToken, ...declaredTokens.slice(1)].join(
    ", ",
  );
  const hasGenericFamily = declaredTokens.some((token) =>
    /^(?:ui-[\w-]+|system-ui|serif|sans-serif|monospace)$/i.test(
      token.replace(/^['"]|['"]$/g, ""),
    ),
  );

  return {
    family,
    stack: hasGenericFamily ? declaredStack : `${declaredStack}, ${fallback}`,
  };
}

function promptsFor(source: string, heading: string): IProjectDesignPrompt[] {
  return tableRows(source, heading).flatMap((cells) => {
    const [title, use, prompt, avoid, assetId] = cells;
    return title && use && prompt && avoid
      ? [{ assetId: assetId || undefined, avoid, prompt, title, use }]
      : [];
  });
}

function mediaFor(source: string, heading: string): IProjectDesignMedia {
  const mediaSource = section(source, heading);
  return {
    examples: promptsFor(mediaSource, "Generation examples"),
    intro:
      sectionParagraphs(mediaSource, "Purpose and evidence boundary")[0] ?? "",
    masterPrompt: sectionBlockquote(mediaSource, "Style master prompt"),
    productionRules: sectionRules(mediaSource, "Production specification"),
  };
}

function interfaceFor(source: string): IProjectDesignInterface {
  const interfaceSource = section(source, "Interface and product surfaces");
  return {
    intro:
      sectionParagraphs(interfaceSource, "Purpose and evidence boundary")[0] ??
      "",
    patterns: tableRows(
      interfaceSource,
      "Confirmed reference patterns",
    ).flatMap((cells) => {
      const [title, decision, avoid, references] = cells;
      return title && decision && avoid
        ? [
            {
              avoid,
              decision,
              references: (references ?? "")
                .split(/[,\s]+/)
                .map((reference) => reference.trim())
                .filter(Boolean),
              title,
            },
          ]
        : [];
    }),
    shapeRules: sectionRules(interfaceSource, "Surface, density, and shape"),
    stateRules: sectionRules(interfaceSource, "Controls, states, and actions"),
  };
}

interface IAssetIndexSource {
  assets?: Array<Record<string, unknown>>;
}

function stringField(
  source: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = source[field];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function previewUrlFor(assetPath: string): string | undefined {
  const normalized = assetPath.replaceAll("\\", "/").replace(/^\.\//, "");
  const workspacePrefix = "apps/studio/workspace/assets/";
  const relative = normalized.startsWith(workspacePrefix)
    ? normalized.slice(workspacePrefix.length)
    : normalized.startsWith("assets/")
      ? normalized.slice("assets/".length)
      : undefined;
  return relative ? `/workspace-assets/${relative}` : undefined;
}

function assetLayer(assetPath: string): ProjectDesignProjection | undefined {
  const normalized = assetPath.replaceAll("\\", "/");
  const match = normalized.match(/(?:^|\/)assets\/(singlepage|startup)\//);
  return match?.[1] as ProjectDesignProjection | undefined;
}

function assetsFor(
  source: string,
  projection?: ProjectDesignProjection,
): IProjectDesignAsset[] {
  if (!source.trim()) return [];
  let index: IAssetIndexSource;
  try {
    index = parse(source) as IAssetIndexSource;
  } catch {
    return [];
  }

  return (index.assets ?? []).flatMap((asset) => {
    const id = stringField(asset, "id");
    const assetPath = stringField(asset, "path");
    const sourceType = stringField(asset, "source_type");
    if (!id || !assetPath || !sourceType) return [];
    const layer = assetLayer(assetPath);
    if (projection && layer && layer !== projection) return [];
    const lifecycle = stringField(asset, "lifecycle");
    const isCurrentGeneratedOutput =
      sourceType === "generated" &&
      (lifecycle === "proposed" || lifecycle === "approved");
    return [
      {
        designKey: stringField(asset, "design_key"),
        designRole: stringField(asset, "design_role"),
        id,
        lifecycle,
        path: assetPath,
        previewUrl: isCurrentGeneratedOutput
          ? previewUrlFor(assetPath)
          : undefined,
        purpose: stringField(asset, "purpose") ?? id,
        sourceType,
      },
    ];
  });
}

const bodyFallback =
  'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
const displayFallback = "ui-sans-serif, system-ui, sans-serif";

function isPrimaryTypographyRole(role: string): boolean {
  return /primary|display|wordmark/.test(role.toLocaleLowerCase());
}

function typographyFor(
  source: string,
  assets: IProjectDesignAsset[],
): IProjectDesignTypographyRole[] {
  const rows = tableRows(firstTable(section(source, "Typography"))).flatMap(
    (cells) => {
      const [role, family, weights, usage, assetId] = cells;
      if (!role || !family || !weights || !usage) return [];
      const normalizedRole = role.toLocaleLowerCase();
      const primaryRole = isPrimaryTypographyRole(normalizedRole);
      const fallback = primaryRole ? displayFallback : bodyFallback;
      const parsedFamily = fontStack(family, fallback);

      if (assetId) {
        const asset = assets.find((candidate) => candidate.id === assetId);
        if (!asset || asset.designRole !== "font") {
          throw new Error(
            `Typography role "${role}" references missing font asset "${assetId}".`,
          );
        }
        const compatibleKeys = primaryRole
          ? ["primary", "display"]
          : ["default", "base"];
        if (asset.designKey && !compatibleKeys.includes(asset.designKey)) {
          throw new Error(
            `Typography role "${role}" expects font design_key "${compatibleKeys[0]}" (legacy alias "${compatibleKeys[1]}"), received "${asset.designKey}".`,
          );
        }
      }

      return [
        {
          assetId: assetId || undefined,
          family: parsedFamily.family,
          fontStack: parsedFamily.stack,
          role,
          usage,
          weights,
        },
      ];
    },
  );

  if (rows.length) return rows;

  const bodySource = valueFor(
    source,
    ["Base, body, controls, labels, and code", "Body type", "Body font"],
    "ui-sans-serif",
  );
  const displaySource = valueFor(
    source,
    ["Wordmark and display", "Display type", "Display font"],
    "ui-serif",
  );
  const bodyFamily = fontLabel(bodySource, "System sans serif");
  const displayFamily = fontLabel(displaySource, "System serif");
  const parsedBodyFamily = fontStack(bodyFamily, bodyFallback);
  const parsedDisplayFamily = fontStack(displayFamily, displayFallback);

  return [
    {
      family: parsedBodyFamily.family,
      fontStack: parsedBodyFamily.stack,
      role: "Default",
      usage: bodySource,
      weights: bodySource.match(/\d{3}(?:\s*[–-]\s*\d{3})?/)?.[0] ?? "normal",
    },
    {
      family: parsedDisplayFamily.family,
      fontStack: parsedDisplayFamily.stack,
      role: "Primary",
      usage: displaySource,
      weights:
        displaySource.match(/\d{3}(?:\s*[–-]\s*\d{3})?/)?.[0] ?? "normal",
    },
  ];
}

export function hasProjectDesignData(workspace: IStudioWorkspace): boolean {
  return (
    meaningfulMarkdown(artifact(workspace, "design")) ||
    assetsFor(artifact(workspace, "asset-index")).length > 0
  );
}

export function resolvedProjectDesignData({
  default: resolved,
  singlepage,
  startup,
}: IProjectDesignWorkspaces): IProjectDesignData {
  return hasProjectDesignData(startup)
    ? projectDesignData(resolved, "startup")
    : projectDesignData(singlepage, "singlepage");
}

export function projectDesignData(
  workspace: IStudioWorkspace,
  projection: ProjectDesignProjection,
): IProjectDesignData {
  const design = artifact(workspace, "design");
  const assetSource = artifact(workspace, "asset-index");
  const assets = assetsFor(assetSource, projection);
  const identityParagraphs = sectionParagraphs(
    design,
    "Brand idea and character",
  );
  const identitySection = section(design, "Brand idea and character");
  const conceptName =
    firstBoldValue(identitySection) ??
    valueFor(
      design,
      ["Selected direction", "Brand name", "Name"],
      "Untitled brand",
    );
  const typographyRoles = typographyFor(design, assets);
  const bodyType =
    typographyRoles.find((role) => /default|base|body/i.test(role.role)) ??
    typographyRoles[0];
  const displayType =
    typographyRoles.find((role) =>
      /primary|display|wordmark/i.test(role.role),
    ) ??
    typographyRoles[1] ??
    typographyRoles[0];
  const semanticColorRows = tableRows(design, "Semantic color system");
  const semanticColorSource = section(design, "Semantic color system");

  return {
    assets,
    bodyType: bodyType.fontStack,
    bodyTypeLabel: bodyType.family,
    colorRoles: semanticColorRows.flatMap((cells) => {
      const [role, light, dark, usage] = cells;
      return role && light && dark && usage
        ? [{ dark, light, role, usage }]
        : [];
    }),
    conceptName,
    conceptSummary:
      identityParagraphs[0] ??
      sectionParagraphs(design, "Identity direction")[0] ??
      conceptName,
    displayType: displayType.fontStack,
    displayTypeLabel: displayType.family,
    doDont: tableRows(design, "Do and do not").flatMap((cells) =>
      cells[0] && cells[1] ? [{ do: cells[0], dont: cells[1] }] : [],
    ),
    graphicRules: [
      ...sectionBullets(design, "Reusable graphic language"),
      ...sectionBullets(design, "Spacing, grid, shape, and hierarchy"),
      ...sectionBullets(design, "Icons, code, diagrams, imagery, and video"),
      ...sectionBullets(design, "Components and selective glass"),
      ...sectionBullets(design, "Motion and accessibility"),
    ],
    illustration: mediaFor(design, "Illustration and diagrams"),
    interface: interfaceFor(design),
    logoRules: sectionBullets(design, "Naming and lockups"),
    palette: {
      accent: colorFor(
        semanticColorSource,
        ["Accent/locator", "Accent"],
        "#0f766e",
      ),
      background: colorFor(
        semanticColorSource,
        ["Canvas", "Background", "Paper"],
        "#f8fafc",
      ),
      foreground: colorFor(
        semanticColorSource,
        ["Text primary", "Foreground", "Ink", "Text"],
        "#0f172a",
      ),
      line: colorFor(
        semanticColorSource,
        ["Border subtle", "Line", "Border"],
        "#cbd5e1",
      ),
      muted: colorFor(semanticColorSource, ["Text muted", "Muted"], "#64748b"),
      primary: colorFor(semanticColorSource, ["Action", "Primary"], "#0f172a"),
      surface: colorFor(
        semanticColorSource,
        ["Surface", "Card", "Panel"],
        "#ffffff",
      ),
    },
    photography: mediaFor(design, "Photography"),
    preferenceProfile: sectionParagraphs(
      design,
      "Client visual preference profile",
    ).join(" "),
    projection,
    typographyRoles,
    typographyRules: [
      ...typographyRoles.map(
        (role) => `${role.role}: ${role.family} ${role.weights}. ${role.usage}`,
      ),
      ...sectionBullets(design, "Typography"),
    ],
  };
}
