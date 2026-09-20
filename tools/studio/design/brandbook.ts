import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

import {
  hasMarkdownContent,
  parseDocument,
  type DocumentLayer,
  type IDocumentConfirmation,
} from "../workspace/document";

/** Stage order of the pre-development pipeline, used to gate this check. */
const stages = [
  "00-business",
  "10-strategy",
  "20-brand",
  "30-design",
  "40-products",
] as const;

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
  const stage =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as { active_stage?: unknown }).active_stage
      : undefined;
  const index =
    typeof stage === "string"
      ? stages.indexOf(stage as (typeof stages)[number])
      : -1;
  return index >= stages.indexOf("30-design");
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

/** Name the document's own state, and the layer when an approval sits upstream. */
function describeOwnership(
  confirmation: IDocumentConfirmation | undefined,
): string {
  if (!confirmation) return "unconfirmed";
  const { state, underlying, layer, sources } = confirmation;
  const named =
    underlying && underlying !== "unconfirmed"
      ? `${state} over ${underlying}`
      : state;
  const from = sources?.length ? ` from ${sources.join(", ")}` : "";
  const where = layer === "startup" ? "" : ` in the ${layer} layer`;
  return `${named}${from}${where}`;
}

/**
 * A downstream project must own its brandbook rather than shipping the
 * framework's. Inheritance is the explicit starting state, so this only applies
 * once that project's own cursor has reached `30-design`.
 */
export async function findUnownedBrandbook(
  workspaceRoot: string,
  layer: DocumentLayer,
  confirmation: IDocumentConfirmation | undefined,
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
  } else {
    // The resolved review owns this state. Recomputing it here would hash the
    // layer's own file while the stamp covers the body a reader is shown, so
    // one document would answer two different questions. An inherited
    // singlepage approval still never satisfies a startup gate.
    const own = confirmation?.underlying ?? confirmation?.state;
    if (own !== "confirmed" || confirmation?.layer !== "startup")
      findings.push({
        requirement: "design/startup.md holds its own confirmation",
        detail: `Resolved state is ${describeOwnership(confirmation)}; a downstream Design needs its own operator approval.`,
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
  confirmation: IDocumentConfirmation | undefined,
): Promise<void> {
  const findings = await findUnownedBrandbook(
    workspaceRoot,
    layer,
    confirmation,
  );
  if (!findings.length) return;
  throw new Error(
    [
      "This project reached 30-design without owning its brandbook:",
      ...findings.map(
        ({ requirement, detail }) => `- ${requirement}\n  ${detail}`,
      ),
      "Write the startup layer's own Design and Assets, or move the cursor back to the stage that is actually current.",
    ].join("\n"),
  );
}
