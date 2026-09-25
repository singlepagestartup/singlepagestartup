/**
 * BDD Suite: React Flight debug info shim for the bundled Next.js runtimes
 * Given a Next.js install whose bundled React Flight client copies debug info without deduplication
 * When the postinstall shim rewrites the affected function in minified and formatted bundles
 * Then each debug info entry transfers once and untouched or already patched sources stay unchanged
 */

import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ORIGINAL_SOURCE,
  PATCHED_SOURCE,
  listCandidateFiles,
  patchInstalledNext,
  patchSource,
} from "./patch-next-flight-debug-info.mjs";

const FORMATTED_ORIGINAL = `
    function transferReferencedDebugInfo(parentChunk, referencedChunk) {
      if (null !== parentChunk) {
        referencedChunk = referencedChunk._debugInfo;
        parentChunk = parentChunk._debugInfo;
        for (var i = 0; i < referencedChunk.length; ++i) {
          var debugInfoEntry = referencedChunk[i];
          null == debugInfoEntry.name && parentChunk.push(debugInfoEntry);
        }
      }
    }
    function getOutlinedModel(response, reference, parentObject, key, map) {`;

function loadTransfer(source) {
  const start = source.indexOf("function transferReferencedDebugInfo");
  assert.notEqual(start, -1);

  let depth = 0;
  for (let index = source.indexOf("{", start); index < source.length; index++) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) {
      return new Function(
        `${source.slice(start, index + 1)}; return transferReferencedDebugInfo;`,
      )();
    }
  }

  throw new Error("unterminated function");
}

const silentLogger = { info() {} };

test("rewrites the minified runtime bundle in place", () => {
  const source = `var x=1;${ORIGINAL_SOURCE}function next(){}`;

  const result = patchSource(source);

  assert.equal(result.status, "patched");
  assert.equal(result.source, `var x=1;${PATCHED_SOURCE}function next(){}`);
});

test("rewrites the formatted development bundle in place", () => {
  const result = patchSource(FORMATTED_ORIGINAL);

  assert.equal(result.status, "patched");
  assert.ok(result.source.includes(PATCHED_SOURCE));
  assert.ok(result.source.includes("function getOutlinedModel"));
  assert.ok(!/parentChunk\.push/.test(result.source));
});

test("leaves already patched and unrelated sources unchanged", () => {
  assert.deepEqual(patchSource(PATCHED_SOURCE), {
    source: PATCHED_SOURCE,
    changed: false,
    status: "already-patched",
  });
  assert.deepEqual(patchSource("function other(){}"), {
    source: "function other(){}",
    changed: false,
    status: "not-applicable",
  });
});

test("transfers each unnamed debug info entry only once", () => {
  const original = loadTransfer(ORIGINAL_SOURCE);
  const patched = loadTransfer(PATCHED_SOURCE);
  const asyncInfo = { awaited: {} };
  const componentInfo = { name: "Widget" };
  const referenced = { _debugInfo: [asyncInfo, componentInfo] };

  const withOriginal = { _debugInfo: [] };
  original(withOriginal, referenced);
  original(withOriginal, referenced);

  const withPatch = { _debugInfo: [] };
  patched(withPatch, referenced);
  patched(withPatch, referenced);
  patched(withPatch, { _debugInfo: [asyncInfo, { awaited: {} }] });

  assert.deepEqual(withOriginal._debugInfo, [asyncInfo, asyncInfo]);
  assert.equal(withPatch._debugInfo.length, 2);
  assert.equal(withPatch._debugInfo[0], asyncInfo);
  assert.ok(withPatch._debugInfo.every((entry) => entry.name === undefined));
});

test("patches only development Flight client bundles under the compiled directory", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "next-flight-shim-"));

  try {
    const runtime = path.join(root, "next-server");
    const client = path.join(root, "react-server-dom-turbopack", "cjs");
    await mkdir(runtime, { recursive: true });
    await mkdir(client, { recursive: true });
    await writeFile(
      path.join(runtime, "app-page-turbo.runtime.dev.js"),
      ORIGINAL_SOURCE,
    );
    await writeFile(
      path.join(runtime, "app-page-turbo.runtime.prod.js"),
      ORIGINAL_SOURCE,
    );
    await writeFile(
      path.join(
        client,
        "react-server-dom-turbopack-client.node.development.js",
      ),
      FORMATTED_ORIGINAL,
    );
    await writeFile(
      path.join(
        client,
        "react-server-dom-turbopack-server.node.development.js",
      ),
      "function server(){}",
    );

    assert.deepEqual(
      listCandidateFiles(root)
        .map((file) => path.relative(root, file))
        .sort(),
      [
        "next-server/app-page-turbo.runtime.dev.js",
        "react-server-dom-turbopack/cjs/react-server-dom-turbopack-client.node.development.js",
        "react-server-dom-turbopack/cjs/react-server-dom-turbopack-server.node.development.js",
      ],
    );

    const first = patchInstalledNext(root, silentLogger);
    const second = patchInstalledNext(root, silentLogger);

    assert.equal(first.patched.length, 2);
    assert.equal(first.notApplicable.length, 1);
    assert.equal(second.patched.length, 0);
    assert.equal(second.alreadyPatched.length, 2);
    assert.equal(
      await readFile(
        path.join(runtime, "app-page-turbo.runtime.prod.js"),
        "utf8",
      ),
      ORIGINAL_SOURCE,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("reports nothing to patch for a Next.js that already ships the fix", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "next-flight-shim-fixed-"));
  const messages = [];

  try {
    await mkdir(path.join(root, "next-server"), { recursive: true });
    await writeFile(
      path.join(root, "next-server", "app-page.runtime.dev.js"),
      "function other(){}",
    );

    const summary = patchInstalledNext(root, {
      info: (message) => messages.push(message),
    });

    assert.equal(summary.patched.length, 0);
    assert.match(messages.join("\n"), /nothing to patch/);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
