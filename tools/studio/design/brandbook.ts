import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

import {
  hasMarkdownContent,
  parseDocument,
  type DocumentLayer,
} from "../workspace/document";

export interface IBrandbookFinding {
  requirement: string;
  detail: string;
}

async function read(file: string): Promise<string> {
  return readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
}

/**
 * Headings and frontmatter alone never make a document its own decision. The
 * shared scanner is a content-presence check, not sanitization, and never
 * returns rewritten text.
 */
function meaningfulMarkdown(value: string): boolean {
  return hasMarkdownContent(parseDocument(value).body);
}

function reachedDesign(cursor: string): boolean {
  const parsed = cursor.trim() ? (parse(cursor) as unknown) : undefined;
  const section =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as { active_section?: unknown }).active_section
      : undefined;
  return section === "design" || section === "materials";
}

function registeredAssets(source: string): number {
  if (!source.trim()) return 0;
  try {
    const index = parse(source) as { assets?: unknown };
    return Array.isArray(index?.assets) ? index.assets.length : 0;
  } catch {
    return 0;
  }
}

/**
 * A downstream project must own its brandbook rather than shipping the
 * framework's. Inheritance is the explicit starting state, so this only applies
 * when that project has selected Design or Materials.
 */
export async function findUnownedBrandbook(
  workspaceRoot: string,
  layer: DocumentLayer,
): Promise<IBrandbookFinding[]> {
  if (layer !== "startup") return [];

  const cursor = await read(
    path.join(workspaceRoot, "utils", "pre-development", "startup.yaml"),
  );
  if (!reachedDesign(cursor)) return [];

  const findings: IBrandbookFinding[] = [];
  const design = await read(path.join(workspaceRoot, "design", "startup.md"));

  if (!meaningfulMarkdown(design)) {
    findings.push({
      requirement: "design/startup.md carries this project's own decisions",
      detail:
        "The document is empty, so the project would ship the framework's visual system as if it were its own.",
    });
  }

  const assets = await read(path.join(workspaceRoot, "assets", "startup.yaml"));
  if (registeredAssets(assets) === 0)
    findings.push({
      requirement: "assets/startup.yaml registers this project's own assets",
      detail:
        "No asset is registered, so fonts, marks and media resolve entirely from the framework layer.",
    });

  return findings;
}

export async function validateOwnedBrandbook(
  workspaceRoot: string,
  layer: DocumentLayer,
): Promise<void> {
  const findings = await findUnownedBrandbook(workspaceRoot, layer);
  if (!findings.length) return;
  throw new Error(
    [
      "The selected project does not own its brandbook:",
      ...findings.map(
        ({ requirement, detail }) => `- ${requirement}\n  ${detail}`,
      ),
      "Record this project's Design and Assets when that work is selected. This diagnostic does not change the workflow cursor.",
    ].join("\n"),
  );
}
