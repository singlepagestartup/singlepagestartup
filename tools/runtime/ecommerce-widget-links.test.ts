import { describe, it, expect } from "bun:test";
import { randomUUID } from "node:crypto";
import { prepareCommerceWidgetCutover } from "./ecommerce-widget-links";
import {
  applyWidgetCutover,
  rollbackWidgetCutover,
  type IWidgetCutoverAdapter,
} from "./ai-chat-widget-links";
function setup() {
  const records = new Map<string, Map<string, any>>();
  const put = (entity: string, row: any) => {
    if (!records.has(entity)) records.set(entity, new Map());
    records.get(entity)!.set(row.id, structuredClone(row));
  };
  put("ecommerce.widget", {
    id: "source",
    slug: "catalog",
    variant: "product-list-default",
    title: { en: "Products", ru: "Товары" },
    subtitle: {},
    description: { en: "Original copy" },
    anchor: "catalog",
    className: "p-4",
    adminTitle: "Catalog",
  });
  put("host.widgets-to-external-widgets", {
    id: "link",
    widgetId: "host",
    variant: "default",
    externalModule: "ecommerce",
    externalWidgetId: "source",
  });
  const adapter: IWidgetCutoverAdapter = async (entity) =>
    ({
      find: async (props: any) =>
        [...(records.get(entity)?.values() ?? [])]
          .filter((row) =>
            props.params.filters.and.every(
              (f: any) => row[f.column] === f.value,
            ),
          )
          .map((row) => structuredClone(row)),
      create: async ({ data }: any) => {
        const row = { ...data, id: randomUUID() };
        put(entity, row);
        return row;
      },
      update: async ({ id, data }: any) => {
        const row = { ...records.get(entity)!.get(id), ...data };
        put(entity, row);
        return row;
      },
    }) as any;
  return {
    records,
    put,
    adapter,
    input: { targets: [{ hostLinkId: "link", ecommerceWidgetId: "source" }] },
  };
}
describe("Ecommerce Widget transfer", () => {
  it("preserves translated content and original records, switches Host last, and supports repeat/rollback/reapply", async () => {
    const s = setup();
    const original = structuredClone(
      s.records.get("ecommerce.widget")!.get("source"),
    );
    const manifest = await prepareCommerceWidgetCutover(s.input, s.adapter);
    expect(s.records.get("rbac.widget")).toBeUndefined();
    expect(manifest.operations.at(-1)?.entity).toBe(
      "host.widgets-to-external-widgets",
    );
    await applyWidgetCutover(manifest, s.adapter, async () => {});
    const content = [...s.records.get("website-builder.widget")!.values()][0];
    expect(content.title).toEqual(original.title);
    expect(content.description).toEqual(original.description);
    expect(content.anchor).toBe(original.anchor);
    expect(content.className).toBe(original.className);
    expect(s.records.get("ecommerce.widget")!.get("source")).toEqual(original);
    const seedMatches = [
      ...s.records.get("host.widgets-to-external-widgets")!.values(),
    ].filter(
      (row) => row.widgetId === "host" && row.externalWidgetId === "source",
    );
    expect(seedMatches).toHaveLength(1);
    expect(seedMatches[0].variant).toBe("hidden");
    expect(
      (await applyWidgetCutover(manifest, s.adapter, async () => {})).updated,
    ).toBe(0);
    expect(
      (await prepareCommerceWidgetCutover(s.input, s.adapter)).operations,
    ).toEqual([]);
    await rollbackWidgetCutover(manifest, s.adapter, async () => {});
    expect(
      s.records.get("host.widgets-to-external-widgets")!.get("link")
        .externalModule,
    ).toBe("ecommerce");
    const again = await prepareCommerceWidgetCutover(s.input, s.adapter);
    expect(again.operations).toHaveLength(1);
    await applyWidgetCutover(again, s.adapter, async () => {});
    expect(
      s.records.get("host.widgets-to-external-widgets")!.get("link")
        .externalModule,
    ).toBe("rbac");
  });
  it("refuses concurrent source edits before switching Host", async () => {
    const s = setup();
    const m = await prepareCommerceWidgetCutover(s.input, s.adapter);
    s.put("ecommerce.widget", {
      ...s.records.get("ecommerce.widget")!.get("source"),
      title: { en: "New copy" },
    });
    await expect(
      applyWidgetCutover(m, s.adapter, async () => {}),
    ).rejects.toThrow("Stale before manifest");
    expect(
      s.records.get("host.widgets-to-external-widgets")!.get("link")
        .externalModule,
    ).toBe("ecommerce");
  });
});
