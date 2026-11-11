/**
 * BDD Suite: entity-owned migration history.
 * Given: the checked-in model and relation targets.
 * When: an entity's migrations are generated independently.
 * Then: generating an entity never writes to the shared migration journal.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "../../../../../..");
const hook = "npx nx run @sps/providers-db:repository-generate";
const modules = readdirSync(path.join(root, "libs/modules"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

it.each(modules)(
  "keeps every %s repository generation target uncached and independent of the provider journal",
  (module) => {
    const project = JSON.parse(
      readFileSync(
        path.join(root, "libs/modules", module, "project.json"),
        "utf8",
      ),
    );
    for (const [name, target] of Object.entries<any>(project.targets)) {
      if (!name.endsWith("repository-generate")) continue;
      expect(target.cache).toBe(false);
      expect(target.options.parallel).toBe(false);
      const commands = target.options.commands.map(
        (command: string | { command: string }) =>
          typeof command === "string" ? command : command.command,
      );
      if (!commands.some((command: string) => command.includes("drizzle-kit")))
        continue;
      expect(commands).not.toContain(hook);
    }
  },
);

it.each([
  ["apps/api/project.json", "db:generate"],
  ["libs/providers/db/project.json", "repository-generate"],
])("keeps %s generation uncached", (file, target) => {
  const project = JSON.parse(readFileSync(path.join(root, file), "utf8"));
  expect(project.targets[target].cache).toBe(false);
  expect(project.targets[target].options.parallel).toBe(false);
});
