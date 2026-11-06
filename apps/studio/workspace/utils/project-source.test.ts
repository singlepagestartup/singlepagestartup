import { describe, expect, test, mock } from "bun:test";
const { projectArtifactWorkspaces } = await import("./project-source");

describe("Studio source layers and resolved documents", () => {
  for (const kind of ["brief", "strategy", "brand", "design"]) {
    test(`${kind}: startup is its own source; only default inherits the framework`, () => {
      const base =
        "# Документ\n\n## Общее\n\nФакт фреймворка.\n\n## Дополнение\n\nБазовое условие.\n";
      const empty = projectArtifactWorkspaces({
        kind,
        singlepage: base,
        startup: "",
      });
      expect(empty.startup.artifacts[0].content).toBe("");
      expect(empty.startup.artifacts[0].sourcePaths).toEqual([
        `apps/studio/workspace/${kind}/startup.md`,
      ]);
      expect(empty.default.artifacts[0].inherited).toBe(true);
      expect(empty.default.artifacts[0].content).toContain("Факт фреймворка.");
      const override = "# Документ\n\n## Общее\n\nФакт клиента.\n";
      const edited = projectArtifactWorkspaces({
        kind,
        singlepage: base,
        startup: override,
      });
      expect(edited.singlepage.artifacts[0].content).toBe(base);
      expect(edited.startup.artifacts[0].content).toBe(override);
      expect(edited.startup.artifacts[0].content).not.toContain(
        "Базовое условие.",
      );
      expect(edited.default.artifacts[0].content).toContain("Факт клиента.");
      expect(edited.default.artifacts[0].content).toContain("Базовое условие.");
      expect(edited.default.artifacts[0].content).not.toContain(
        "Факт фреймворка.",
      );
      expect(edited.default.artifacts[0].sourcePaths).toEqual([
        `apps/studio/workspace/${kind}/singlepage.md`,
        `apps/studio/workspace/${kind}/startup.md`,
      ]);
    });
  }
});
