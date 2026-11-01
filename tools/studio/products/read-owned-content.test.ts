import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { readOwnedContent } from "./read-owned-content";

test("reads the current landing and service copy from their owning layouts", () => {
  const root = path.resolve(
    import.meta.dir,
    "../../../apps/studio/workspace/products/singlepage/ai-chat/website",
  );
  const landing = readOwnedContent<{ hero: { title: string } }>(
    path.join(root, "Landing.tsx"),
  );
  expect(landing.hero.title).toContain("описание проекта");
  for (const name of ["Login", "Register", "Settings", "Help", "Tokens"]) {
    const service = readOwnedContent<{ sections: { hero: { title: string } } }>(
      path.join(root, `${name}.tsx`),
    );
    expect(service.sections.hero.title.length).toBeGreaterThan(0);
  }
});

test("reads literal TS data and rejects expressions instead of executing them", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "sps-owned-content-"));
  const file = path.join(root, "Page.tsx");
  try {
    writeFileSync(
      file,
      'const pageContent = {title: "A", rows: [1, true, null]} as const;',
    );
    expect(readOwnedContent(file)).toEqual({
      title: "A",
      rows: [1, true, null],
    });
    writeFileSync(file, "const pageContent = loadContent();");
    expect(() => readOwnedContent(file)).toThrow(
      "Unsupported content expression",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
