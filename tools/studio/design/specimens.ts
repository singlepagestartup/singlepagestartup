import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import ts from "typescript";

import {
  flattenDesignSections,
  parseDesignLayout,
  resolveDesignLayout,
} from "../../../apps/studio/workspace/utils/design/layout";
import type { IBrandbookFinding } from "./brandbook";

/**
 * A specimen declares itself with `data-specimen="<id>"` so completeness is
 * checkable without parsing intent out of markup.
 */
export const requiredSpecimens = {
  actions:
    "the one dominant action with its secondary, plain, disabled and separated destructive variants",
  icons:
    "a dedicated icon set with its library or drawing method, usage rules and rendered glyphs",
  selection: "selection as a chip and as a grouped choice",
  status: "status and progress",
  fields: "fields and data rows",
  navigation: "navigation for a public page and for a work screen",
  choices: "native selection controls and binary settings",
  combobox: "a searchable choice with keyboard selection",
  "date-time": "date and time entry with bounds",
  range: "bounded numeric adjustment",
  tabs: "keyboard-operable related views",
  breadcrumbs: "the current location in a hierarchy",
  pagination: "bounded page navigation and result counts",
  avatars: "people and fallback identities",
  "data-table": "searchable sortable and selectable tabular records",
  accordion: "expandable sections with keyboard access",
  "structured-list": "structured records and their actions",
  alerts: "inline informational and error messages",
  toast: "dismissible transient feedback",
  loading: "indeterminate and placeholder loading",
  "empty-error": "empty results and recoverable errors",
  dialog: "a modal with focus containment and return",
  confirmation: "confirmation before a destructive action",
  sheet: "a dismissible side panel",
  popover: "contextual help and interactive anchored content",
  menu: "keyboard-operable action menus",
  command: "searchable commands and an empty result",
  "file-upload": "local file selection, drop, validation and removal",
  attachments: "file metadata and processing or error states",
  message: "conversation roles and delivery states",
  composer: "message entry, send, pending, stop and retry",
  surfaces: "reusable cards, square media frames and dividers",
  "editorial-entry": "an editorial entry composition",
  "content-card": "a content card carrying the project's own confirmed imagery",
  "icon-card": "an icon card on the declared icon grid",
  "item-grid": "a repeated item grid",
} as const;

/** Required only when the project's own decisions call for them. */
export const conditionalSpecimens = {
  "dark-pair": "the Semantic color system declares a Dark column",
} as const;

/**
 * Part of the catalogue and available to every layer, but owed only when the
 * surfaces a project ships call for them.
 */
export const optionalSpecimens = {
  "media-and-text": "an illustration beside the statement it explains",
  "numbered-steps": "the ordered steps a visitor walks through",
  "offer-comparison": "the offers a visitor chooses between",
  "contextual-sheet": "the sheet a phone keeps in view while the page scrolls",
} as const;

export type SpecimenId =
  | keyof typeof requiredSpecimens
  | keyof typeof conditionalSpecimens
  | keyof typeof optionalSpecimens;

/**
 * The wrapper belongs to the framework and a project supplies the content, so a
 * specimen keeps one name in every layer. A downstream Design restyles a block
 * and changes how it carries information; it does not rename one, invent one or
 * translate its heading.
 */
export const specimenTitles: Record<SpecimenId, string> = {
  surfaces: "Surfaces and media",
  actions: "Actions",
  icons: "Icons",
  selection: "Selection",
  status: "Status and progress",
  fields: "Fields and data rows",
  navigation: "Navigation",
  "dark-pair": "Dark pair",
  choices: "Checkboxes, radios and switches",
  combobox: "Combobox",
  "date-time": "Date and time",
  range: "Range and slider",
  tabs: "Tabs",
  breadcrumbs: "Breadcrumbs",
  pagination: "Pagination",
  avatars: "Avatars",
  "data-table": "Data table",
  accordion: "Accordion",
  "structured-list": "Structured list",
  alerts: "Alerts",
  toast: "Toast",
  loading: "Loading and skeleton",
  "empty-error": "Empty and error states",
  dialog: "Dialog",
  confirmation: "Confirmation dialog",
  sheet: "Sheet",
  popover: "Popover and tooltip",
  menu: "Dropdown menu",
  command: "Command search",
  "file-upload": "File upload",
  attachments: "Attachments",
  message: "Messages",
  composer: "Message composer",
  "editorial-entry": "Editorial entry",
  "content-card": "Photo cards",
  "icon-card": "Icon cards",
  "media-and-text": "Illustration and text",
  "numbered-steps": "Numbered steps",
  "item-grid": "Repeated item grid",
  "offer-comparison": "Offer comparison",
  "contextual-sheet": "Contextual sheet",
};

/** Stable taxonomy for agents; a project's tokens and content supply its style. */
export const specimenCategories: Record<SpecimenId, string> = {
  surfaces: "data-display",
  icons: "foundations",
  "dark-pair": "foundations",
  actions: "actions",
  selection: "inputs",
  fields: "inputs",
  navigation: "navigation",
  status: "data-display",
  choices: "inputs",
  combobox: "inputs",
  "date-time": "inputs",
  range: "inputs",
  tabs: "navigation",
  breadcrumbs: "navigation",
  pagination: "navigation",
  avatars: "data-display",
  "data-table": "data-display",
  accordion: "data-display",
  "structured-list": "data-display",
  alerts: "feedback",
  toast: "feedback",
  loading: "feedback",
  "empty-error": "feedback",
  dialog: "overlays",
  confirmation: "overlays",
  sheet: "overlays",
  popover: "overlays",
  menu: "overlays",
  command: "overlays",
  "file-upload": "files",
  attachments: "files",
  message: "conversation",
  composer: "conversation",
  "editorial-entry": "content-blocks",
  "content-card": "content-blocks",
  "icon-card": "content-blocks",
  "media-and-text": "content-blocks",
  "numbered-steps": "content-blocks",
  "item-grid": "content-blocks",
  "offer-comparison": "content-blocks",
  "contextual-sheet": "content-blocks",
};

export const compositionComponents = {
  "offer-comparison": ["surfaces", "actions"],
  "contextual-sheet": ["surfaces", "actions", "icons", "status", "fields"],
  "content-card": ["surfaces"],
  "icon-card": ["surfaces", "icons"],
  "item-grid": ["surfaces", "actions", "status", "icons"],
  "editorial-entry": ["surfaces", "actions", "icons"],
  "numbered-steps": ["surfaces", "structured-list"],
  "media-and-text": ["surfaces", "actions", "icons"],
} as const;

const interfaceHeading = /^##\s+Interface and product surfaces\s*$/m;

async function read(file: string): Promise<string> {
  return readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
}

interface IDeclaredSpecimen {
  id: string;
  title?: string;
  composes?: string[];
}

/** Inspect actual JSX nodes, so examples in strings or comments never count. */
export function readSpecimenDeclarations(
  source: string,
  file: string,
): IDeclaredSpecimen[] {
  if (/\.[jt]sx$/i.test(file)) {
    const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const found: IDeclaredSpecimen[] = [];
    const attribute = (
      attributes: ts.JsxAttributes,
      name: string,
    ): string | undefined => {
      const property = attributes.properties.find(
        (item) => ts.isJsxAttribute(item) && item.name.getText(tree) === name,
      );
      if (!property || !ts.isJsxAttribute(property)) return undefined;
      const value = property.initializer;
      if (value && ts.isStringLiteral(value)) return value.text;
      if (
        value &&
        ts.isJsxExpression(value) &&
        value.expression &&
        ts.isStringLiteral(value.expression)
      )
        return value.expression.text;
      return undefined;
    };
    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const opening = ts.isJsxElement(node) ? node.openingElement : node;
        const isWrapper = opening.tagName.getText(tree) === "Specimen";
        const id = attribute(
          opening.attributes,
          isWrapper ? "id" : "data-specimen",
        );
        if (id) {
          const heading = ts.isJsxElement(node)
            ? node.children.find(
                (child) =>
                  ts.isJsxElement(child) &&
                  child.openingElement.tagName.getText(tree) === "h3",
              )
            : undefined;
          const title = isWrapper
            ? attribute(opening.attributes, "title")
            : heading && ts.isJsxElement(heading)
              ? heading.children
                  .map((child) => (ts.isJsxText(child) ? child.text : ""))
                  .join(" ")
                  .replace(/\s+/g, " ")
                  .trim()
              : undefined;
          found.push({
            id,
            title,
            composes: attribute(opening.attributes, "data-composes")
              ?.split(/\s+/)
              .filter(Boolean),
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(tree);
    return found;
  }
  const html = source.replace(/<!--[\s\S]*?-->/g, "");
  const marks = [...html.matchAll(/data-specimen="([a-z0-9-]+)"/g)];
  return marks.map((mark, index) => {
    const fragment = html.slice(
      mark.index! + mark[0].length,
      marks[index + 1]?.index ?? html.length,
    );
    const title = /<h3[^>]*>\s*([\s\S]*?)\s*<\/h3>/
      .exec(fragment)?.[1]
      .replace(/\s+/g, " ")
      .trim();
    return {
      id: mark[1],
      title,
      composes: /data-composes="([^"]+)"/
        .exec(fragment.split(">")[0])?.[1]
        .split(/\s+/),
    };
  });
}

/** A dark pair is owed once the colour system actually defines a dark column. */
function declaresDarkColumn(design: string): boolean {
  const section = design
    .split(/^###\s+Semantic color system\s*$/m)[1]
    ?.split(/^#{2,3}\s+/m)[0];
  if (!section) return false;
  const header = section
    .split("\n")
    .find((line) => line.trim().startsWith("|"));
  return Boolean(header && /\|\s*Dark\s*\|/i.test(header));
}

function omittedSpecimens(design: string): Map<string, string> {
  const frontmatter = design.startsWith("---\n")
    ? design.slice(4).split("\n---\n")[0]
    : "";
  const omissions = new Map<string, string>();
  if (!frontmatter.trim()) return omissions;
  let parsed: unknown;
  try {
    parsed = parse(frontmatter);
  } catch {
    return omissions;
  }
  const declared = (
    parsed as { interface_review?: { omitted_specimens?: unknown } }
  )?.interface_review?.omitted_specimens;
  if (!declared || typeof declared !== "object" || Array.isArray(declared))
    return omissions;
  for (const [id, reason] of Object.entries(
    declared as Record<string, unknown>,
  ))
    if (typeof reason === "string" && reason.trim())
      omissions.set(id, reason.trim());
  return omissions;
}

/**
 * Design ships rendered specimens, not only rules. Once a layer documents an
 * interface language, the specimens that prove it must exist in what renders.
 */
export async function findMissingSpecimens(
  workspaceRoot: string,
): Promise<IBrandbookFinding[]> {
  const design = {
    singlepage: await read(path.join(workspaceRoot, "design", "singlepage.md")),
    startup: await read(path.join(workspaceRoot, "design", "startup.md")),
  };
  const documented = [design.singlepage, design.startup].filter((source) =>
    interfaceHeading.test(source),
  );
  if (!documented.length) return [];

  const layouts = await Promise.all(
    (["singlepage", "startup"] as const).map(async (layer) =>
      parseDesignLayout(
        await read(path.join(workspaceRoot, "design", layer, "layout.yaml")),
        layer,
      ),
    ),
  );
  const layout = resolveDesignLayout(layouts[0], layouts[1]);

  const present = new Set<string>();
  await Promise.all(
    flattenDesignSections(layout.sections)
      .filter(({ source }) => source && /\.(?:html?|[jt]sx)$/i.test(source))
      .map(async ({ source }) => {
        const html = await read(
          path.join(workspaceRoot, "design", layout.layer, source!),
        );
        for (const { id } of readSpecimenDeclarations(html, source!))
          present.add(id);
      }),
  );

  const omissions = omittedSpecimens(documented[documented.length - 1]);
  const owed = new Map<string, string>(Object.entries(requiredSpecimens));
  if (documented.some(declaresDarkColumn))
    owed.set("dark-pair", conditionalSpecimens["dark-pair"]);

  return [...owed]
    .filter(([id]) => !present.has(id) && !omissions.has(id))
    .map(([id, description]) => ({
      requirement: `Design declares a \`${id}\` specimen`,
      detail: `Nothing in the resolved Design layout renders ${description}. Add it to a layer-owned HTML section with data-specimen="${id}" or a TSX/JSX section with <Specimen id="${id}" title="…">, or record interface_review.omitted_specimens.${id} with the reason it is out of scope.`,
    }));
}

/**
 * The framework owns the wrapper: which blocks exist, what each one is called
 * and what the section that holds them is called. A downstream Design restyles
 * a block and changes how it carries information, so a deviation here is a
 * renamed or invented wrapper rather than a design decision.
 */
export async function findSpecimenDeviations(
  workspaceRoot: string,
): Promise<IBrandbookFinding[]> {
  const sources = await Promise.all(
    (["singlepage", "startup"] as const).map(async (layer) =>
      parseDesignLayout(
        await read(path.join(workspaceRoot, "design", layer, "layout.yaml")),
        layer,
      ),
    ),
  );
  const framework = sources[0];
  const layout = resolveDesignLayout(framework, sources[1]);

  const findings: IBrandbookFinding[] = [];
  const frameworkTitles = new Map(
    flattenDesignSections(framework?.sections ?? [])
      .filter(({ title }) => title)
      .map(({ id, title }) => [id, title] as const),
  );
  for (const section of flattenDesignSections(layout.sections)) {
    const owned = frameworkTitles.get(section.id);
    if (owned && section.title !== owned)
      findings.push({
        requirement: `Design section \`${section.id}\` keeps its framework title`,
        detail: `design/${layout.layer}/layout.yaml calls it "${section.title}"; the framework section is "${owned}". A project restyles a section, it does not rename one.`,
      });
  }

  await Promise.all(
    flattenDesignSections(layout.sections)
      .filter(({ source }) => source && /\.(?:html?|[jt]sx)$/i.test(source))
      .map(async ({ id, source }) => {
        const file = path.join(workspaceRoot, "design", layout.layer, source!);
        for (const {
          id: specimen,
          title: heading,
          composes,
        } of readSpecimenDeclarations(await read(file), source!)) {
          const title = specimenTitles[specimen as SpecimenId];
          if (!title) {
            findings.push({
              requirement: `Design section \`${id}\` renders only catalogued specimens`,
              detail: `design/${layout.layer}/${source} declares data-specimen="${specimen}", which the framework catalogue does not define. Add the block to the framework catalogue before a project ships it.`,
            });
            continue;
          }
          if (specimen in compositionComponents) {
            if (!composes?.length)
              findings.push({
                requirement: `Composition \`${specimen}\` declares its components`,
                detail: `design/${layout.layer}/${source} needs data-composes with its Interface kit component IDs.`,
              });
            for (const component of composes ?? []) {
              if (
                !(component in specimenCategories) ||
                specimenCategories[component as SpecimenId] === "content-blocks"
              )
                findings.push({
                  requirement: `Composition \`${specimen}\` uses catalogued components`,
                  detail: `Its data-composes names "${component}"; use an Interface kit component ID.`,
                });
            }
          }
          if (heading !== undefined && heading !== title)
            findings.push({
              requirement: `Specimen \`${specimen}\` keeps its framework title`,
              detail: `design/${layout.layer}/${source} heads it "${heading}"; the framework calls it "${title}". The wrapper name is the framework's, the content is the project's.`,
            });
        }
      }),
  );
  return findings.sort((left, right) =>
    left.requirement.localeCompare(right.requirement),
  );
}

export async function validateRequiredSpecimens(
  workspaceRoot: string,
): Promise<void> {
  const findings = await findMissingSpecimens(workspaceRoot);
  if (!findings.length) return;
  throw new Error(
    [
      "Design documents an interface language without the specimens that prove it:",
      ...findings.map(
        ({ requirement, detail }) => `- ${requirement}\n  ${detail}`,
      ),
    ].join("\n"),
  );
}
