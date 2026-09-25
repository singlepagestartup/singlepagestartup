/**
 * Applies facebook/react#37481 ("[Flight] Fix RangeError from exponential debug
 * info growth") to the React Flight clients that `next` bundles under
 * `node_modules/next/dist/compiled`.
 *
 * Why this exists: `next@16.3.6` bundles `react@19.3.0-canary-cbb046ab-20260731`,
 * which predates the fix. In development the Flight client copies every unnamed
 * `_debugInfo` entry from a referenced chunk into the receiving chunk each time
 * a `$ref` resolves, so a deep server-component tree with many awaited fetches
 * (the SPS catch-all page) grows the arrays multiplicatively and the dev server
 * dies with `RangeError: Invalid array length` or a V8 heap OOM within seconds.
 * Production runtimes carry no debug info and are not touched.
 *
 * The replacement is the upstream implementation: a per-chunk `Set` records
 * which entries were already received, so each entry transfers once.
 *
 * Remove this script (and its `postinstall` hook) once the installed `next`
 * bundles React with the fix, i.e. a canary dated 2026-09-02 or later or
 * `react@>=19.3.0`. The script then finds nothing to patch and says so.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ORIGINAL_SOURCE =
  "function transferReferencedDebugInfo(parentChunk,referencedChunk){if(null!==parentChunk){referencedChunk=referencedChunk._debugInfo,parentChunk=parentChunk._debugInfo;for(var i=0;i<referencedChunk.length;++i){var debugInfoEntry=referencedChunk[i];null==debugInfoEntry.name&&parentChunk.push(debugInfoEntry)}}}";

export const PATCHED_SOURCE =
  "function transferReferencedDebugInfo(receivingChunk,referencedChunk){if(null!==receivingChunk){referencedChunk=referencedChunk._debugInfo;var receivingDebugInfo=receivingChunk._debugInfo,receivedDebugInfo=receivingChunk._receivedDebugInfo;for(null==receivedDebugInfo&&(receivedDebugInfo=receivingChunk._receivedDebugInfo=new Set),receivingChunk=0;receivingChunk<referencedChunk.length;++receivingChunk){var debugInfoEntry=referencedChunk[receivingChunk];null!=debugInfoEntry.name||receivedDebugInfo.has(debugInfoEntry)||(receivedDebugInfo.add(debugInfoEntry),receivingDebugInfo.push(debugInfoEntry))}}}";

const PATCH_MARKER = "receivingChunk._receivedDebugInfo";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds a pattern that matches the function in both the minified runtime
 * bundles and the formatted `*.development.js` builds: any whitespace may sit
 * between tokens, and statement separators (`;` and `,`) are optional because
 * the formatter turns comma sequences into separate statements.
 */
function buildOriginalPattern() {
  const tokens = ORIGINAL_SOURCE.match(
    /[A-Za-z_$][\w$]*|\d+|[^\sA-Za-z_$\d]/g,
  ).filter((token) => token !== ";" && token !== ",");

  return new RegExp(tokens.map(escapeRegExp).join("[\\s;,]*"), "g");
}

const ORIGINAL_PATTERN = buildOriginalPattern();

/** Pure transformation; returns the new source and what happened. */
export function patchSource(source) {
  if (source.includes(PATCH_MARKER)) {
    return { source, changed: false, status: "already-patched" };
  }

  ORIGINAL_PATTERN.lastIndex = 0;

  if (!ORIGINAL_PATTERN.test(source)) {
    return { source, changed: false, status: "not-applicable" };
  }

  ORIGINAL_PATTERN.lastIndex = 0;

  return {
    source: source.replace(ORIGINAL_PATTERN, PATCHED_SOURCE),
    changed: true,
    status: "patched",
  };
}

/** Development-only React Flight client bundles shipped inside `next`. */
export function listCandidateFiles(compiledDirectory) {
  const files = [];

  const runtimeDirectory = path.join(compiledDirectory, "next-server");
  for (const name of safeReaddir(runtimeDirectory)) {
    if (name.endsWith(".runtime.dev.js")) {
      files.push(path.join(runtimeDirectory, name));
    }
  }

  for (const name of safeReaddir(compiledDirectory)) {
    if (!name.startsWith("react-server-dom-")) {
      continue;
    }

    const cjsDirectory = path.join(compiledDirectory, name, "cjs");
    for (const fileName of safeReaddir(cjsDirectory)) {
      if (fileName.endsWith(".development.js")) {
        files.push(path.join(cjsDirectory, fileName));
      }
    }
  }

  return files;
}

function safeReaddir(directory) {
  try {
    return statSync(directory).isDirectory() ? readdirSync(directory) : [];
  } catch {
    return [];
  }
}

export function patchInstalledNext(compiledDirectory, logger = console) {
  const summary = { patched: [], alreadyPatched: [], notApplicable: [] };

  for (const file of listCandidateFiles(compiledDirectory)) {
    const result = patchSource(readFileSync(file, "utf8"));
    const relative = path.relative(compiledDirectory, file);

    if (result.status === "patched") {
      writeFileSync(file, result.source);
      summary.patched.push(relative);
    } else if (result.status === "already-patched") {
      summary.alreadyPatched.push(relative);
    } else {
      summary.notApplicable.push(relative);
    }
  }

  const touched = summary.patched.length + summary.alreadyPatched.length;

  if (touched === 0) {
    logger.info(
      "[patch-next-flight-debug-info] nothing to patch: the installed next does not ship the affected React Flight client, this script can be removed",
    );
  } else {
    logger.info(
      `[patch-next-flight-debug-info] patched ${summary.patched.length} file(s), ${summary.alreadyPatched.length} already patched`,
    );
  }

  return summary;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
  );
  const compiledDirectory = path.join(
    repositoryRoot,
    "node_modules",
    "next",
    "dist",
    "compiled",
  );

  try {
    patchInstalledNext(compiledDirectory);
  } catch (error) {
    // Never fail an install because of a development-only shim.
    console.warn(
      `[patch-next-flight-debug-info] skipped: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
