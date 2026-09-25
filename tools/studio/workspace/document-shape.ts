import { check as prettierCheck, resolveConfig } from "prettier";

import { parseDocument } from "./document";

/**
 * A confirmation stamp hashes the body, and the repository formats every
 * Markdown file on commit, so an unformatted document and the committed one are
 * two different bodies. A heading is the other half of the same problem: the
 * framework names a section once and every layer reads that name, so a
 * translated heading turns one section into two.
 */
export interface IDocumentShapeFinding {
  requirement: string;
  detail: string;
}

/** Headings in reading order, with their level, as the document declares them. */
export function documentHeadings(source: string): string[] {
  return [...parseDocument(source).body.matchAll(/^(#{1,6}) (.+)$/gm)].map(
    ([, level, text]) => `${level} ${text.trim()}`,
  );
}

/**
 * Every heading the framework declares exists in the layer that inherits it,
 * spelled the same way. A project adds sections its business needs; it does not
 * translate or drop the ones it inherits.
 */
export function findTranslatedHeadings({
  framework,
  project,
  projectPath,
}: {
  framework: string;
  project: string;
  projectPath: string;
}): IDocumentShapeFinding[] {
  if (!project.trim()) return [];
  const declared = documentHeadings(project);
  const missing = documentHeadings(framework).filter(
    (heading) => !declared.includes(heading),
  );
  if (!missing.length) return [];
  return [
    {
      requirement: `${projectPath} keeps every heading the framework declares`,
      detail: `Missing, translated or renamed: ${missing.join("; ")}. A layer adds sections beyond these, and spells an inherited one exactly as the framework does.`,
    },
  ];
}

/**
 * The formatter that runs on commit decides the final bytes, so a check and a
 * stamp both have to read a document in that form. Reporting it keeps this tool
 * read-only: the repository's own format command does the writing.
 */
export async function findUnformattedDocuments(
  files: Array<{ path: string; source: string }>,
): Promise<IDocumentShapeFinding[]> {
  const findings: IDocumentShapeFinding[] = [];
  for (const { path, source } of files) {
    if (!source.trim()) continue;
    // The commit hook runs the Prettier CLI, which reads .editorconfig by
    // default while the API does not. Resolve it the same way or a document
    // that the hook leaves alone is reported as unformatted.
    const options = (await resolveConfig(path, { editorconfig: true })) ?? {};
    if (await prettierCheck(source, { ...options, filepath: path })) continue;
    findings.push({
      requirement: `${path} is already in its committed form`,
      detail:
        "The commit hook formats Markdown, so this body still changes after it is approved. Run the repository's format command, then read the fingerprint and confirm.",
    });
  }
  return findings;
}
