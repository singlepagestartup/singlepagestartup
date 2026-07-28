/**
 * BDD Suite: Next.js static asset synchronization
 * Given a host image with an immutable copy of its current static assets
 * When the host starts with a persistent shared static directory
 * Then current assets are copied and only expired assets from older releases are removed
 */

import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { syncNextStatic } from "./sync-next-static.mjs";

const silentLogger = {
  info() {},
};

async function createFixture() {
  const rootDirectory = await mkdtemp(
    path.join(os.tmpdir(), "next-static-sync-"),
  );
  const bundledDirectory = path.join(rootDirectory, "bundled");
  const sharedDirectory = path.join(rootDirectory, "shared");

  await mkdir(path.join(bundledDirectory, "chunks"), { recursive: true });
  await mkdir(path.join(sharedDirectory, "chunks"), { recursive: true });

  return {
    bundledDirectory,
    cleanup: () => rm(rootDirectory, { force: true, recursive: true }),
    sharedDirectory,
  };
}

/**
 * BDD Scenario: Synchronize a new deployment while retaining recent assets
 * Given current, recent, and expired chunk files
 * When static assets are synchronized with a 30-day retention
 * Then current and recent chunks remain while expired chunks are removed
 */
test("copies current chunks and removes only expired chunks", async () => {
  const fixture = await createFixture();
  const now = Date.parse("2026-07-25T00:00:00.000Z");

  try {
    await writeFile(
      path.join(fixture.bundledDirectory, "chunks", "current.js"),
      "current",
    );
    await writeFile(
      path.join(fixture.sharedDirectory, "chunks", "current.js"),
      "stale-current",
    );
    await writeFile(
      path.join(fixture.sharedDirectory, "chunks", "recent.js"),
      "recent",
    );
    await writeFile(
      path.join(fixture.sharedDirectory, "chunks", "expired.js"),
      "expired",
    );

    const recentDate = new Date(now - 10 * 24 * 60 * 60 * 1000);
    const expiredDate = new Date(now - 31 * 24 * 60 * 60 * 1000);

    await utimes(
      path.join(fixture.sharedDirectory, "chunks", "recent.js"),
      recentDate,
      recentDate,
    );
    await utimes(
      path.join(fixture.sharedDirectory, "chunks", "expired.js"),
      expiredDate,
      expiredDate,
    );

    const result = await syncNextStatic({
      ...fixture,
      logger: silentLogger,
      now,
      retentionDays: 30,
    });

    assert.deepEqual(result, { copied: 1, removed: 1, skipped: false });
    assert.equal(
      await readFile(
        path.join(fixture.sharedDirectory, "chunks", "current.js"),
        "utf8",
      ),
      "current",
    );
    assert.equal(
      await readFile(
        path.join(fixture.sharedDirectory, "chunks", "recent.js"),
        "utf8",
      ),
      "recent",
    );
    await assert.rejects(
      readFile(
        path.join(fixture.sharedDirectory, "chunks", "expired.js"),
        "utf8",
      ),
      { code: "ENOENT" },
    );
  } finally {
    await fixture.cleanup();
  }
});

/**
 * BDD Scenario: Disable pruning
 * Given an old chunk from a previous deployment
 * When static assets are synchronized with zero retention days
 * Then the old chunk remains available
 */
test("keeps old chunks when pruning is disabled", async () => {
  const fixture = await createFixture();

  try {
    await writeFile(
      path.join(fixture.bundledDirectory, "chunks", "current.js"),
      "current",
    );
    await writeFile(
      path.join(fixture.sharedDirectory, "chunks", "old.js"),
      "old",
    );

    const result = await syncNextStatic({
      ...fixture,
      logger: silentLogger,
      retentionDays: 0,
    });

    assert.equal(result.removed, 0);
    assert.equal(
      await readFile(
        path.join(fixture.sharedDirectory, "chunks", "old.js"),
        "utf8",
      ),
      "old",
    );
  } finally {
    await fixture.cleanup();
  }
});

/**
 * BDD Scenario: Reject an invalid retention
 * Given a negative retention period
 * When static asset synchronization starts
 * Then it fails before modifying the shared directory
 */
test("rejects a negative retention period", async () => {
  const fixture = await createFixture();

  try {
    await assert.rejects(
      syncNextStatic({
        ...fixture,
        logger: silentLogger,
        retentionDays: -1,
      }),
      /must be a non-negative integer/,
    );
  } finally {
    await fixture.cleanup();
  }
});
