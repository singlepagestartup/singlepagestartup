import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

import {
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
  selection: "selection as a chip and as a grouped choice",
  status: "status and progress",
  fields: "fields and data rows",
  navigation: "navigation for a public page and for a work screen",
  "editorial-entry": "an editorial entry composition",
  "content-card": "a content card carrying the project's own confirmed imagery",
  "icon-card": "an icon card on the declared icon grid",
  "item-grid": "a repeated item grid",
} as const;

/** Required only when the project's own decisions call for them. */
export const conditionalSpecimens = {
  "dark-pair": "the Semantic color system declares a Dark column",
} as const;

export type SpecimenId =
  | keyof typeof requiredSpecimens
  | keyof typeof conditionalSpecimens;

const interfaceHeading = /^##\s+Interface and product surfaces\s*$/m;

async function read(file: string): Promise<string> {
  return readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
}

function declaredIds(html: string): string[] {
  return [...html.matchAll(/data-specimen="([a-z0-9-]+)"/g)].map(
    ([, id]) => id,
  );
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
    layout.sections
      .filter(({ source }) => source && /\.html?$/i.test(source))
      .map(async ({ source }) => {
        const html = await read(
          path.join(workspaceRoot, "design", layout.layer, source!),
        );
        for (const id of declaredIds(html)) present.add(id);
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
      detail: `Nothing in the resolved Design layout renders ${description}. Add it to a layer-owned HTML section with data-specimen="${id}", or record interface_review.omitted_specimens.${id} with the reason it is out of scope.`,
    }));
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
