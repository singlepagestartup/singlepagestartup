import { describe, expect, it } from "bun:test";
import type { IWidgetCutoverAdapter } from "./ai-chat-widget-links";
import {
  applyPlatformExamples,
  preparePlatformExamples,
  rollbackPlatformExamples,
  type IPlatformInput,
} from "./platform-example-content";

function fixture() {
  const records = new Map<string, Map<string, any>>();
  let serial = 0,
    writes = 0,
    unknownCreate = false;
  const put = (entity: string, row: any) => {
    if (!records.has(entity)) records.set(entity, new Map());
    records.get(entity)!.set(row.id, structuredClone(row));
  };
  put("host.page", {
    id: "page",
    url: "/about",
    title: "Original",
    updatedAt: "before",
  });
  put("ecommerce.order", { id: "paid", status: "completed", amount: 29 });
  const adapter: IWidgetCutoverAdapter = async (entity) =>
    ({
      find: async (props: any) => {
        let rows = [...(records.get(entity)?.values() ?? [])].filter((row) =>
          (props?.params?.filters?.and ?? []).every(
            (filter: any) => row[filter.column] === filter.value,
          ),
        );
        rows = rows.sort((a, b) => a.id.localeCompare(b.id));
        return structuredClone(
          rows.slice(
            props?.params?.offset ?? 0,
            (props?.params?.offset ?? 0) +
              (props?.params?.limit ?? rows.length),
          ),
        );
      },
      create: async ({ data }: any) => {
        writes++;
        const row = {
          ...data,
          id: `saved-${++serial}`,
          updatedAt: `created-${serial}`,
        };
        put(entity, row);
        if (unknownCreate) {
          unknownCreate = false;
          throw Error("Unknown create outcome");
        }
        return row;
      },
      update: async ({ id, data }: any) => {
        writes++;
        const row = {
          ...records.get(entity)!.get(id),
          ...data,
          updatedAt: `updated-${++serial}`,
        };
        put(entity, row);
        return row;
      },
    }) as any;
  const input: IPlatformInput = {
    schema: "sps.platform-example-input.v1",
    targets: [
      {
        key: "widget",
        entity: "website-builder.widget",
        selector: { slug: "about" },
        data: { slug: "about", title: "About" },
      },
      {
        key: "link",
        entity: "host.pages-to-widgets",
        selector: { pageId: "page", widgetId: { $ref: "widget" } },
        data: {
          pageId: "page",
          widgetId: { $ref: "widget" },
          variant: "default",
        },
      },
      {
        key: "page",
        entity: "host.page",
        id: "page",
        selector: { url: "/about" },
        data: { title: "Code Framework" },
        switch: true,
      },
    ],
    protectedSelections: [{ entity: "ecommerce.order", selector: {} }],
  };
  return {
    records,
    adapter,
    input,
    put,
    writes: () => writes,
    unknown: () => {
      unknownCreate = true;
    },
  };
}

describe("platform content publication", () => {
  it("prepares without writes, remaps server IDs, repeats and freshly prepares zero operations", async () => {
    const f = fixture();
    const manifest = await preparePlatformExamples(f.input, f.adapter);
    expect(f.writes()).toBe(0);
    await applyPlatformExamples(manifest, f.adapter, async () => {});
    const widget = [...f.records.get("website-builder.widget")!.values()][0];
    expect(
      [...f.records.get("host.pages-to-widgets")!.values()][0].widgetId,
    ).toBe(widget.id);
    const count = f.writes();
    await applyPlatformExamples(manifest, f.adapter, async () => {});
    expect(f.writes()).toBe(count);
    expect(
      (await preparePlatformExamples(f.input, f.adapter)).operations,
    ).toHaveLength(0);
  });
  it("recovers an unknown create result without duplicating the saved graph", async () => {
    const f = fixture();
    const manifest = await preparePlatformExamples(f.input, f.adapter);
    f.unknown();
    await expect(
      applyPlatformExamples(manifest, f.adapter, async () => {}),
    ).rejects.toThrow("Unknown create");
    await applyPlatformExamples(manifest, f.adapter, async () => {});
    expect(f.records.get("website-builder.widget")!.size).toBe(1);
    expect(f.records.get("host.pages-to-widgets")!.size).toBe(1);
  });
  it("refuses stale edits and changes to protected collections, including new rows", async () => {
    const f = fixture();
    const manifest = await preparePlatformExamples(f.input, f.adapter);
    f.put("host.page", {
      id: "page",
      url: "/about",
      title: "Concurrent",
      updatedAt: "other",
    });
    await expect(
      applyPlatformExamples(manifest, f.adapter, async () => {}),
    ).rejects.toThrow("Stale before");
    expect(f.writes()).toBe(0);
    const next = await preparePlatformExamples(f.input, f.adapter);
    f.put("ecommerce.order", { id: "another", status: "paid" });
    await expect(
      applyPlatformExamples(next, f.adapter, async () => {}),
    ).rejects.toThrow("Protected selection changed");
    expect(f.writes()).toBe(0);
  });
  it("restores existing presentation and retains additive records and security changes", async () => {
    const f = fixture();
    f.put("rbac.permission", {
      id: "policy",
      path: "/protected",
      variant: "default",
    });
    f.input.targets.push({
      key: "security",
      entity: "rbac.permission",
      id: "policy",
      selector: { path: "/protected" },
      data: { variant: "restricted" },
      retainOnRollback: true,
    });
    const manifest = await preparePlatformExamples(f.input, f.adapter);
    await applyPlatformExamples(manifest, f.adapter, async () => {});
    await rollbackPlatformExamples(manifest, f.adapter, async () => {});
    expect(f.records.get("host.page")!.get("page").title).toBe("Original");
    expect(f.records.get("website-builder.widget")!.size).toBe(1);
    expect(f.records.get("ecommerce.order")!.get("paid").status).toBe(
      "completed",
    );
    expect(f.records.get("rbac.permission")!.get("policy").variant).toBe(
      "restricted",
    );
    const retry = await preparePlatformExamples(f.input, f.adapter);
    expect(retry.operations).toHaveLength(1);
  });
  it("requires exact selectors, unique targets and confirmed positive commercial terms", async () => {
    const f = fixture();
    f.input.targets[0].selector = {};
    await expect(preparePlatformExamples(f.input, f.adapter)).rejects.toThrow(
      "exact selector",
    );
    f.input.targets[0].selector = { slug: "about" };
    f.input.targets[0].requiresCommercialConfirmation = true;
    await expect(preparePlatformExamples(f.input, f.adapter)).rejects.toThrow(
      "Confirmed commercial",
    );
    f.input.commercialConfirmation = {
      source: "operator",
      proPeriod: "month",
      prices: [{ currency: "USD", amount: 29 }],
      tokenRate: 0.13,
      packs: [{ price: 100, credits: 769.230769 }],
    };
    expect(
      (await preparePlatformExamples(f.input, f.adapter)).operations,
    ).toHaveLength(3);
    f.input.targets.push({ ...f.input.targets[2], key: "duplicate" });
    await expect(preparePlatformExamples(f.input, f.adapter)).rejects.toThrow(
      "Duplicate target record",
    );
  });
});
