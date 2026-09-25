/**
 * BDD Suite: Layer-aware Studio presentation output
 * Given a framework or downstream repository identity
 * When a presentation output target is resolved
 * Then every derivative is routed below the matching Studio layer directory
 */

import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolvePresentationOutputTarget } from "./output";

const temporaryRoots: string[] = [];

function createRepository(): string {
  const repositoryRoot = mkdtempSync(
    path.join(os.tmpdir(), "singlepagestartup-presentation-"),
  );
  temporaryRoots.push(repositoryRoot);
  const workspaceRoot = path.join(repositoryRoot, "apps/studio/workspace");
  mkdirSync(path.join(workspaceRoot, "utils"), { recursive: true });
  writeFileSync(
    path.join(workspaceRoot, "utils/config.yaml"),
    "active_layer: auto\ndefault_layer: startup\nrepository_layers:\n  singlepagestartup/singlepagestartup: singlepage\n",
  );
  return repositoryRoot;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Studio presentation output routing", () => {
  /**
   * BDD Scenario: Route the framework presentation to singlepage
   * Given the canonical framework repository identity
   * When the default presentation target is resolved
   * Then its HTML, PDF, PNG, and manifest stay below output/singlepage
   */
  test("routes the framework output to singlepage", () => {
    const repositoryRoot = createRepository();
    const target = resolvePresentationOutputTarget({
      repositoryIdentity: "singlepagestartup/singlepagestartup",
      repositoryRoot,
    });

    expect(target.layer).toBe("singlepage");
    expect(target.outputDirectory).toBe(
      path.join(repositoryRoot, "apps/studio/output/singlepage"),
    );
    expect(target.htmlPath.startsWith(target.outputDirectory)).toBe(true);
    expect(target.pdfPath.startsWith(target.outputDirectory)).toBe(true);
    expect(target.pngDirectory.startsWith(target.outputDirectory)).toBe(true);
    expect(target.manifestPath.startsWith(target.outputDirectory)).toBe(true);
  });

  /**
   * BDD Scenario: Route an unmapped repository to startup
   * Given a downstream repository identity that is absent from the framework map
   * When the presentation target is resolved
   * Then the default startup layer owns every derivative
   */
  test("routes downstream output to startup", () => {
    const repositoryRoot = createRepository();
    const target = resolvePresentationOutputTarget({
      repositoryIdentity: "example/downstream-product",
      repositoryRoot,
    });

    expect(target.layer).toBe("startup");
    expect(target.outputDirectory).toBe(
      path.join(repositoryRoot, "apps/studio/output/startup"),
    );
  });

  /**
   * BDD Scenario: Reject a caller-selected conflicting layer
   * Given the canonical framework repository resolves to singlepage
   * When a caller asserts startup
   * Then generation stops instead of mixing the two project levels
   */
  test("rejects a conflicting layer assertion", () => {
    const repositoryRoot = createRepository();

    expect(() =>
      resolvePresentationOutputTarget({
        assertedLayer: "startup",
        repositoryIdentity: "singlepagestartup/singlepagestartup",
        repositoryRoot,
      }),
    ).toThrow("conflicts with repository layer singlepage");
  });
});
