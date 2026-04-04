/**
 * BDD Suite: website-builder startup SDK unit contracts.
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

describe("website-builder startup SDK unit contracts", () => {
  const moduleRoot = join(process.cwd(), "libs/modules/website-builder");
  const startupIndexFiles = collectFiles(moduleRoot, "index.ts").filter(
    (filePath) =>
      filePath.includes(join("sdk", "client", "src", "lib", "startup")) ||
      filePath.includes(join("sdk", "server", "src", "lib", "startup")),
  );

  it("keeps startup SDK entrypoints discoverable", () => {
    expect(startupIndexFiles.length).toBeGreaterThan(0);
  });

  it("keeps startup SDK entrypoints wired to singlepage adapters", () => {
    const sources = startupIndexFiles.map((filePath) =>
      readFileSync(filePath, "utf-8"),
    );

    expect(
      sources.every((source) => source.includes('from "../singlepage"')),
    ).toBe(true);
    expect(sources.every((source) => source.includes("export const api"))).toBe(
      true,
    );
  });

  it("keeps startup SDK type export contracts", () => {
    const sourceByPath = startupIndexFiles.map((filePath) => ({
      relativePath: relative(moduleRoot, filePath),
      source: readFileSync(filePath, "utf-8"),
    }));

    for (const item of sourceByPath) {
      expect(item.source).toContain("export type IProps");
      expect(item.source).toContain("export type IResult");
      expect(item.relativePath).toContain(join("sdk"));
    }
  });
});
