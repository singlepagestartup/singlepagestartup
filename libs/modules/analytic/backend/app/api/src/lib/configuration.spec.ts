/**
 * BDD Suite: analytic configuration unit contracts.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

function collectFiles(dir: string, fileName: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, fileName));
      continue;
    }

    if (entry.isFile() && entry.name === fileName) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("analytic configuration unit contracts", () => {
  const moduleRoot = join(process.cwd(), "libs/modules/analytic");
  const configurationFiles = collectFiles(
    moduleRoot,
    "configuration.ts",
  ).filter((filePath) =>
    filePath.includes(join("backend", "app", "api", "src", "lib")),
  );

  it("keeps backend configuration files discoverable", () => {
    expect(configurationFiles.length).toBeGreaterThan(0);
  });

  it("keeps configuration class contract in each backend configuration file", () => {
    const sources = configurationFiles.map((filePath) =>
      readFileSync(filePath, "utf-8"),
    );

    expect(
      sources.every((source) => /class\s+Configuration\b/.test(source)),
    ).toBe(true);
    expect(sources.every((source) => /super\(\{/.test(source))).toBe(true);
  });

  it("keeps module seed metadata anchored to the current module", () => {
    const sourceByPath = configurationFiles.map((filePath) => ({
      relativePath: relative(moduleRoot, filePath),
      source: readFileSync(filePath, "utf-8"),
    }));

    for (const item of sourceByPath) {
      expect(item.source).toMatch(/seed:\s*\{/);
      expect(item.source).toContain('module: "analytic"');
      expect(item.relativePath).toContain(
        join("backend", "app", "api", "src", "lib"),
      );
    }
  });
});
