import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  collectModuleInventory,
  missingModuleDirectories,
  scaffoldModuleDirectories,
  type GeneratedModuleInventory,
} from "./inventory";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "sps-studio-modules-"));
  temporaryRoots.push(root);
  return root;
}

const inventory: GeneratedModuleInventory = {
  modulesRoot: "libs/modules",
  studioRoot: "apps/studio",
  totals: { modules: 2, entities: 2, variants: 0, coveredVariants: 0 },
  modules: [
    {
      name: "startup",
      entities: [
        {
          module: "startup",
          entityType: "model",
          entity: "widget",
          componentRoot:
            "libs/modules/startup/models/widget/frontend/component",
          variants: [],
        },
      ],
    },
    {
      name: "social",
      entities: [
        {
          module: "social",
          entityType: "relation",
          entity: "profiles-to-blog-module-articles",
          componentRoot:
            "libs/modules/social/relations/profiles-to-blog-module-articles/frontend/component",
          variants: [],
        },
      ],
    },
  ],
};

describe("Studio module directories", () => {
  test("prepares both layers for models and relations in a fresh child project", async () => {
    const root = await fixtureRoot();
    const missing = await missingModuleDirectories(inventory, root);
    expect(missing).toEqual([
      "apps/studio/modules/startup/models/widget/singlepage",
      "apps/studio/modules/startup/models/widget/startup",
      "apps/studio/modules/social/relations/profiles-to-blog-module-articles/singlepage",
      "apps/studio/modules/social/relations/profiles-to-blog-module-articles/startup",
    ]);

    expect(await scaffoldModuleDirectories(inventory, root)).toEqual(missing);
    expect(await missingModuleDirectories(inventory, root)).toEqual([]);
    for (const directory of missing) {
      expect(
        await readFile(path.join(root, directory, ".gitkeep"), "utf8"),
      ).toBe("");
    }
    expect(await scaffoldModuleDirectories(inventory, root)).toEqual([]);
  });

  test("preserves project components and unrelated module directories", async () => {
    const root = await fixtureRoot();
    const component = path.join(
      root,
      "apps/studio/modules/startup/models/widget/startup/hero/Component.tsx",
    );
    const custom = path.join(root, "apps/studio/modules/custom/note.md");
    for (const file of [component, custom]) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, "project-owned content\n");
    }
    const before = await stat(component);

    await scaffoldModuleDirectories(inventory, root);
    await scaffoldModuleDirectories(inventory, root);

    expect(await readFile(component, "utf8")).toBe("project-owned content\n");
    expect((await stat(component)).mtimeMs).toBe(before.mtimeMs);
    expect(await readFile(custom, "utf8")).toBe("project-owned content\n");
    expect(await readdir(path.dirname(path.dirname(component)))).not.toContain(
      ".gitkeep",
    );
  });

  test("discovers Startup Widget and keeps the repository's module tree complete", async () => {
    const actual = await collectModuleInventory();
    const widget = actual.modules
      .find((moduleRecord) => moduleRecord.name === "startup")
      ?.entities.find((entity) => entity.entity === "widget");

    expect(widget?.entityType).toBe("model");
    expect(
      widget?.variants.find(
        (variant) =>
          variant.scope === "singlepage" && variant.variant === "default",
      )?.coveredBy,
    ).toContain("startup.widget.default");
    expect(await missingModuleDirectories(actual)).toEqual([]);
  });
});

describe("Host Studio coverage", () => {
  test("all four models and five relations have discoverable stories", async () => {
    const actual = await collectModuleInventory();
    const host = actual.modules.find((record) => record.name === "host")!;
    expect(host.entities).toHaveLength(9);
    expect(
      host.entities.filter((entity) => !entity.storyFiles?.length),
    ).toEqual([]);
    for (const entity of host.entities) {
      const management =
        entity.entityType === "model" ? "admin-v2-list" : "admin-v2-manager";
      expect(
        entity.storyFiles?.some((file) => file.includes(`/${management}/`)),
      ).toBe(true);
    }
  });
  test("local page recipes remain discoverable without production registration", async () => {
    const actual = await collectModuleInventory();
    const page = actual.modules
      .find((record) => record.name === "host")!
      .entities.find((entity) => entity.entity === "page")!;
    expect(
      page.storyFiles?.some((file) => file.includes("/singlepage/ai-chat/")),
    ).toBe(true);
    expect(page.variants.some((item) => item.variant === "ai-chat")).toBe(
      false,
    );
    expect(
      page.variants.find(
        (item) => item.scope === "singlepage" && item.variant === "default",
      )?.coveredBy,
    ).toContain("host.page.default");
    expect(
      page.variants.find(
        (item) => item.scope === "startup" && item.variant === "default",
      )?.coveredBy ?? [],
    ).not.toContain("host.page.default");
  });
});

describe("AI Chat project ownership", () => {
  test("discovers Profile, Chat, Thread and Message ownership", async () => {
    const actual = await collectModuleInventory();
    const social = actual.modules.find((record) => record.name === "social")!;
    const profile = social.entities.find(
      (entity) => entity.entityType === "model" && entity.entity === "profile",
    )!;
    for (const variant of [
      "ai-chat-project-select",
      "ai-chat-sidebar",
      "ai-chat-create",
      "ai-chat-settings",
      "ai-chat-project",
      "ai-chat-user-menu",
    ])
      expect(
        profile.storyFiles?.some((file) =>
          file.includes(`/singlepage/${variant}/`),
        ),
      ).toBe(true);
    for (const [entity, variants] of [
      ["chat", ["ai-chat-products"]],
      [
        "thread",
        [
          "ai-chat-products",
          "ai-chat-conversation",
          "ai-chat-composer",
          "ai-chat-create",
          "ai-chat-settings",
        ],
      ],
      ["message", ["ai-chat-message"]],
    ] as const) {
      const record = social.entities.find(
        (item) => item.entityType === "model" && item.entity === entity,
      )!;
      for (const variant of variants)
        expect(
          record.storyFiles?.some((file) =>
            file.includes(`/singlepage/${variant}/`),
          ),
        ).toBe(true);
    }
    for (const entity of ["chats-to-threads", "threads-to-messages"]) {
      const relation = social.entities.find(
        (item) => item.entityType === "relation" && item.entity === entity,
      )!;
      expect(
        relation.storyFiles?.some((file) =>
          file.includes("/singlepage/ai-chat-find/"),
        ),
      ).toBe(true);
    }
    const message = social.entities.find(
      (item) => item.entityType === "model" && item.entity === "message",
    )!;
    expect(
      message.storyFiles?.some((file) =>
        file.includes("/ai-chat-conversation/"),
      ),
    ).toBe(false);
  });
});

describe("AI Chat Source ownership", () => {
  test("discovers Source section and its existing File relation", async () => {
    const inventory = await collectModuleInventory();
    const knowledge = inventory.modules.find(
      (module) => module.name === "knowledge",
    )!;
    const source = knowledge.entities.find(
      (entity) => entity.entityType === "model" && entity.entity === "source",
    )!;
    const relation = knowledge.entities.find(
      (entity) =>
        entity.entityType === "relation" &&
        entity.entity === "sources-to-file-storage-module-files",
    )!;
    expect(
      source.storyFiles?.some((file) =>
        file.includes("/singlepage/ai-chat-card/"),
      ),
    ).toBe(true);
    expect(
      relation.storyFiles?.some((file) =>
        file.includes("/singlepage/ai-chat-find/"),
      ),
    ).toBe(true);
  });
});
