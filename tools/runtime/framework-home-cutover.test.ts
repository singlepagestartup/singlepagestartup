import { expect, test } from "bun:test";
import type { IContentEntityDescriptor } from "../../apps/mcp/lib/content-management/types";
import { assertRetiredContentUnreferenced } from "./framework-home-cutover";

const target = { entity: "website-builder.widget", id: "legacy-demo" };
const websiteLink = {
  entity: "website-builder.widgets-to-features",
  id: "legacy-feature",
};
const hostLink = {
  entity: "host.widgets-to-external-widgets",
  id: "legacy-host-link",
};
const articleLink = {
  entity: "blog.articles-to-website-builder-module-widgets",
  id: "unrelated-blog-link",
};

const descriptors = [
  {
    key: websiteLink.entity,
    module: "website-builder",
    relationFields: [{ name: "widgetId" }, { name: "featureId" }],
  },
  {
    key: hostLink.entity,
    module: "host",
    relationFields: [{ name: "widgetId" }, { name: "externalWidgetId" }],
    externalModules: ["website-builder", "rbac"],
  },
  {
    key: articleLink.entity,
    module: "blog",
    relationFields: [
      { name: "articleId" },
      { name: "websiteBuilderModuleWidgetId" },
    ],
  },
] as IContentEntityDescriptor[];

test("allows the exact legacy relation deletion and Host link retarget", async () => {
  await assertRetiredContentUnreferenced(
    target,
    descriptors,
    async (reference) => {
      if (reference.entity === websiteLink.entity) return [websiteLink];
      if (reference.entity === hostLink.entity) {
        expect(reference.filters).toEqual({
          externalWidgetId: target.id,
          externalModule: "website-builder",
        });
        return [hostLink];
      }
      return [];
    },
    new Set([`${websiteLink.entity}:${websiteLink.id}`]),
    new Map([
      [
        `${hostLink.entity}:${hostLink.id}`,
        { ...hostLink, data: { externalWidgetId: "framework" } },
      ],
    ]),
  );
});

test("blocks removal if another article still renders the same demo widget", async () => {
  await expect(
    assertRetiredContentUnreferenced(target, descriptors, async (reference) =>
      reference.entity === articleLink.entity ? [articleLink] : [],
    ),
  ).rejects.toThrow("unrelated-blog-link");
});
