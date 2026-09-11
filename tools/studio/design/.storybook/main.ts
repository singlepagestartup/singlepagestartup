import path from "node:path";
import { fileURLToPath } from "node:url";
import base from "../../../../apps/studio/.storybook/main.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const studioConfig = path.join(root, "apps/studio/.storybook");
export default {
  ...base,
  stories: [path.join(root, "tools/studio/design/fixtures/Layout.stories.tsx")],
  staticDirs: [
    {
      from: path.join(root, "tools/studio/design/fixtures/startup"),
      to: "/workspace-design/startup",
    },
    ...(base.staticDirs ?? []).map((entry) =>
      typeof entry === "string"
        ? path.resolve(studioConfig, entry)
        : { ...entry, from: path.resolve(studioConfig, entry.from) },
    ),
  ],
  viteFinal: async (config, options) => ({
    ...(await base.viteFinal!(config, options)),
    root: path.join(root, "apps/studio"),
  }),
} satisfies typeof base;
