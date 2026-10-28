import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import type { IWidgetCutoverAdapter } from "./ai-chat-widget-links";
import {
  applyFrameworkWidgetCutover,
  frameworkWidgetCutoverCli,
  prepareFrameworkWidgetCutover,
  rollbackFrameworkWidgetCutover,
  verifyFrameworkWidgetCutover,
  type IFrameworkGraphReference,
  type IFrameworkWidgetInput,
} from "./framework-widget-links";

const references: IFrameworkGraphReference[] = [
  {
    entity: "blog.articles-to-website-builder-module-widgets",
    column: "websiteBuilderModuleWidgetId",
    target: "website-builder.widget",
  },
  {
    entity: "crm.widgets-to-website-builder-module-widgets",
    column: "websiteBuilderModuleWidgetId",
    target: "website-builder.widget",
  },
  {
    entity: "website-builder.widgets-to-features",
    column: "featureId",
    target: "website-builder.feature",
  },
  {
    entity: "website-builder.features-to-file-storage-module-files",
    column: "fileStorageModuleFileId",
    target: "file-storage.file",
  },
  {
    entity: "social.messages-to-file-storage-module-files",
    column: "fileStorageModuleFileId",
    target: "file-storage.file",
  },
];
function setup() {
  const records = new Map<string, Map<string, any>>();
  const put = (entity: string, data: any) => {
    if (!records.has(entity)) records.set(entity, new Map());
    records.get(entity)!.set(data.id, structuredClone(data));
  };
  const get = (entity: string, id: string) =>
    structuredClone(records.get(entity)?.get(id));
  const all = (entity: string) =>
    [...(records.get(entity)?.values() ?? [])].map((row) =>
      structuredClone(row),
    );
  const writes: { operation: string; entity: string; id: string }[] = [];
  let unknownCreate = "";
  let unknownUpdate = "";
  let count = 0;
  put("website-builder.widget", {
    id: "hero",
    slug: "framework-hero",
    variant: "content-default",
    title: { en: "Hero", ru: "Заголовок" },
    description: { en: "Saved hero" },
  });
  put("website-builder.widgets-to-sliders", {
    id: "hero-slider",
    widgetId: "hero",
    sliderId: "slider",
    orderIndex: 3,
    variant: "default",
  });
  put("website-builder.slider", { id: "slider", variant: "default" });
  put("crm.widget", {
    id: "crm",
    slug: "contact",
    variant: "form-list-default",
    adminTitle: "Contact",
    className: "",
  });
  put("crm.form", {
    id: "form",
    slug: "contact-form",
    title: { en: "Contact us", ru: "Напишите нам" },
    subtitle: {},
    description: { en: "Saved form copy" },
  });
  put("crm.widgets-to-forms", {
    id: "crm-form",
    widgetId: "crm",
    formId: "form",
    orderIndex: 7,
    variant: "default",
  });
  put("crm.forms-to-steps", {
    id: "form-step",
    formId: "form",
    stepId: "step",
    orderIndex: 2,
    variant: "default",
  });
  put("crm.steps-to-inputs", {
    id: "step-input",
    stepId: "step",
    inputId: "input",
    orderIndex: 11,
    variant: "default",
  });
  put("crm.input", {
    id: "input",
    variant: "select-option-default",
    title: { en: "Saved dynamic field" },
    isRequired: true,
  });
  put("host.widgets-to-external-widgets", {
    id: "contact-host",
    widgetId: "host-contact",
    externalModule: "crm",
    externalWidgetId: "crm",
    variant: "default",
    orderIndex: 4,
    className: "",
  });
  put("host.widgets-to-external-widgets", {
    id: "hero-host",
    widgetId: "host-hero",
    externalModule: "website-builder",
    externalWidgetId: "hero",
    variant: "default",
  });
  put("crm.widgets-to-website-builder-module-widgets", {
    id: "crm-frame",
    widgetId: "crm",
    websiteBuilderModuleWidgetId: "hero",
    variant: "default",
    orderIndex: 5,
  });
  put("blog.article", {
    id: "article",
    slug: "private-demo",
    description: { en: "Public introduction" },
  });
  put("website-builder.widget", {
    id: "secret",
    slug: "private-widget",
    variant: "content-default",
    description: { en: "SPS-PRIVATE-TEST" },
  });
  put("blog.articles-to-website-builder-module-widgets", {
    id: "private-link",
    articleId: "article",
    websiteBuilderModuleWidgetId: "secret",
    variant: "default",
    orderIndex: 8,
    className: "",
  });
  put("ecommerce.product", {
    id: "subscription",
    slug: "subscription",
    type: "subscription",
    variant: "default",
  });
  put("rbac.role", { id: "subscriber-role", slug: "subscriber" });
  put("rbac.roles-to-ecommerce-module-products", {
    id: "role-product",
    roleId: "subscriber-role",
    ecommerceModuleProductId: "subscription",
    variant: "default",
  });
  const adapter: IWidgetCutoverAdapter = async (entity) =>
    ({
      find: async (props: any) =>
        all(entity)
          .filter((row) =>
            (props?.params?.filters?.and ?? []).every(
              (filter: any) => row[filter.column] === filter.value,
            ),
          )
          .sort((a, b) => String(a.id).localeCompare(String(b.id)))
          .slice(
            props?.params?.offset ?? 0,
            (props?.params?.offset ?? 0) +
              (props?.params?.limit ?? Number.MAX_SAFE_INTEGER),
          ),
      create: async ({ data }: any) => {
        const row = {
          ...data,
          id: randomUUID(),
          createdAt: "2026-10-23T00:00:00.000Z",
          updatedAt: `write-${++count}`,
        };
        put(entity, row);
        writes.push({ entity, operation: "create", id: row.id });
        if (unknownCreate === entity) {
          unknownCreate = "";
          throw Error("Unknown create outcome");
        }
        return structuredClone(row);
      },
      update: async ({ id, data }: any) => {
        const row = {
          ...get(entity, id),
          ...data,
          updatedAt: `write-${++count}`,
        };
        put(entity, row);
        writes.push({ entity, operation: "update", id });
        if (unknownUpdate === entity) {
          unknownUpdate = "";
          throw Error("Unknown update outcome");
        }
        return structuredClone(row);
      },
    }) as any;
  const input: IFrameworkWidgetInput = {
    contact: {
      hostLinkId: "contact-host",
      crmWidgetId: "crm",
      crmFormId: "form",
      crmPresentationLinkId: "crm-frame",
      sharedHeroWidgetId: "hero",
    },
    privateArticles: [
      {
        articleId: "article",
        articleWidgetLinkIds: ["private-link"],
        subscriptionProductId: "subscription",
      },
    ],
  };
  const prepare = (value = input) =>
    prepareFrameworkWidgetCutover(value, adapter, references);
  return {
    records,
    put,
    get,
    all,
    writes,
    adapter,
    input,
    prepare,
    loseCreate: (entity: string) => {
      unknownCreate = entity;
    },
    loseUpdate: (entity: string) => {
      unknownUpdate = entity;
    },
  };
}
const persist = async () => {};

describe("Framework exact-instance SDK cutover", () => {
  it("isolates contact from shared hero, retains real Form graph, switches Host last and repeats without writes", async () => {
    const s = setup();
    const originals = {
      hero: s.get("website-builder.widget", "hero"),
      slider: s.get("website-builder.widgets-to-sliders", "hero-slider"),
      input: s.get("crm.input", "input"),
      form: s.get("crm.form", "form"),
    };
    const manifest = await s.prepare();
    expect(s.writes).toEqual([]);
    expect(manifest.operations.at(-1)?.id).toBe("contact-host");
    await applyFrameworkWidgetCutover(manifest, s.adapter, persist);
    expect(s.writes.at(-1)?.id).toBe("contact-host");
    expect(s.get("website-builder.widget", "hero")).toEqual(originals.hero);
    expect(s.get("website-builder.widgets-to-sliders", "hero-slider")).toEqual(
      originals.slider,
    );
    expect(s.get("crm.input", "input")).toEqual(originals.input);
    expect(s.get("crm.form", "form")).toEqual(originals.form);
    const frame = s
      .all("website-builder.widget")
      .find((row) => row.variant === "content-feature-find-row")!;
    expect(frame.title).toEqual(originals.form.title);
    expect(
      s
        .all("website-builder.widgets-to-sliders")
        .filter((row) => row.widgetId === frame.id),
    ).toEqual([]);
    expect(
      s.get("crm.widgets-to-website-builder-module-widgets", "crm-frame")
        .websiteBuilderModuleWidgetId,
    ).toBe(frame.id);
    expect(
      s.all("rbac.widgets-to-crm-module-widgets")[0].crmModuleWidgetId,
    ).toBe("crm");
    expect(
      s
        .all("host.widgets-to-external-widgets")
        .filter(
          (row) => row.externalModule === "crm" && row.variant === "hidden",
        ),
    ).toHaveLength(1);
    expect(
      s.get("blog.articles-to-website-builder-module-widgets", "private-link"),
    ).toMatchObject({
      variant: "private",
      orderIndex: 8,
      articleId: "article",
      websiteBuilderModuleWidgetId: "secret",
    });
    expect(
      s.all("blog.articles-to-ecommerce-module-products")[0],
    ).toMatchObject({
      variant: "subscription",
      ecommerceModuleProductId: "subscription",
    });
    await verifyFrameworkWidgetCutover(manifest, s.adapter);
    const writeCount = s.writes.length;
    expect(
      (await applyFrameworkWidgetCutover(manifest, s.adapter, persist)).created,
    ).toBe(0);
    expect(s.writes).toHaveLength(writeCount);
    expect((await s.prepare()).operations).toEqual([]);
  });
  it("rolls back presentation roots while retaining security classification, then reuses additive records", async () => {
    const s = setup();
    const manifest = await s.prepare();
    await applyFrameworkWidgetCutover(manifest, s.adapter, persist);
    await rollbackFrameworkWidgetCutover(manifest, s.adapter, persist);
    expect(
      s.get("host.widgets-to-external-widgets", "contact-host"),
    ).toMatchObject({ externalModule: "crm", externalWidgetId: "crm" });
    expect(
      s.get("crm.widgets-to-website-builder-module-widgets", "crm-frame")
        .websiteBuilderModuleWidgetId,
    ).toBe("hero");
    expect(
      s.get("blog.articles-to-website-builder-module-widgets", "private-link")
        .variant,
    ).toBe("private");
    expect(s.all("blog.articles-to-ecommerce-module-products")[0].variant).toBe(
      "subscription",
    );
    const count = s.all("rbac.widget").length;
    const again = await s.prepare();
    await applyFrameworkWidgetCutover(again, s.adapter, persist);
    expect(s.all("rbac.widget")).toHaveLength(count);
    await verifyFrameworkWidgetCutover(again, s.adapter);
  });
  it("recovers unknown server-assigned create IDs without duplicate frames or broken references", async () => {
    const s = setup();
    const manifest = await s.prepare();
    s.loseCreate("website-builder.widget");
    await expect(
      applyFrameworkWidgetCutover(manifest, s.adapter, persist),
    ).rejects.toThrow("Unknown create outcome");
    expect(
      s.get("host.widgets-to-external-widgets", "contact-host").externalModule,
    ).toBe("crm");
    await applyFrameworkWidgetCutover(manifest, s.adapter, persist);
    expect(
      s
        .all("website-builder.widget")
        .filter((row) => row.variant === "content-feature-find-row"),
    ).toHaveLength(1);
    await verifyFrameworkWidgetCutover(manifest, s.adapter);
  });
  it("recovers a private-mark update response loss while retaining graph topology checks", async () => {
    const s = setup();
    const manifest = await s.prepare();
    s.loseUpdate("blog.articles-to-website-builder-module-widgets");
    await expect(
      applyFrameworkWidgetCutover(manifest, s.adapter, persist),
    ).rejects.toThrow("Unknown update outcome");
    await applyFrameworkWidgetCutover(manifest, s.adapter, persist);
    await verifyFrameworkWidgetCutover(manifest, s.adapter);
  });
  it("refuses stale source content before writes and concurrent presentation edits during rollback", async () => {
    const s = setup();
    const manifest = await s.prepare();
    s.put("crm.form", {
      ...s.get("crm.form", "form"),
      title: { en: "Concurrent edit" },
    });
    await expect(
      applyFrameworkWidgetCutover(manifest, s.adapter, persist),
    ).rejects.toThrow("Stale before manifest");
    expect(s.writes).toEqual([]);
    const next = await s.prepare();
    await applyFrameworkWidgetCutover(next, s.adapter, persist);
    s.put("crm.widgets-to-website-builder-module-widgets", {
      ...s.get("crm.widgets-to-website-builder-module-widgets", "crm-frame"),
      className: "changed-by-an-editor",
    });
    await expect(
      rollbackFrameworkWidgetCutover(next, s.adapter, persist),
    ).rejects.toThrow("concurrent edit");
  });
  it("fails closed for shared roots, shared descendants, external files and newly added graph edges", async () => {
    const root = setup();
    root.put("crm.widgets-to-website-builder-module-widgets", {
      id: "another-owner",
      widgetId: "other",
      websiteBuilderModuleWidgetId: "secret",
    });
    await expect(root.prepare()).rejects.toThrow("Shared private graph");
    const child = setup();
    child.put("website-builder.widgets-to-features", {
      id: "edge",
      widgetId: "secret",
      featureId: "feature",
      orderIndex: 2,
    });
    child.put("website-builder.feature", {
      id: "feature",
      title: { en: "Private child" },
    });
    child.put("website-builder.widgets-to-features", {
      id: "public-edge",
      widgetId: "hero",
      featureId: "feature",
    });
    await expect(child.prepare()).rejects.toThrow("Shared private graph");
    const file = setup();
    file.put("website-builder.widgets-to-features", {
      id: "edge",
      widgetId: "secret",
      featureId: "feature",
    });
    file.put("website-builder.feature", { id: "feature" });
    file.put("website-builder.features-to-file-storage-module-files", {
      id: "file-edge",
      featureId: "feature",
      fileStorageModuleFileId: "file",
    });
    file.put("file-storage.file", {
      id: "file",
      file: "https://example.test/public-secret.png",
    });
    await expect(file.prepare()).rejects.toThrow("managed copy");
    file.put("file-storage.file", {
      id: "file",
      file: "/file-storage/private-test.png",
    });
    file.put("social.messages-to-file-storage-module-files", {
      id: "public-file",
      messageId: "message",
      fileStorageModuleFileId: "file",
    });
    await expect(file.prepare()).rejects.toThrow("Shared private graph");
    const changed = setup();
    const manifest = await changed.prepare();
    changed.put("website-builder.widgets-to-features", {
      id: "edge",
      widgetId: "secret",
      featureId: "feature",
    });
    changed.put("website-builder.feature", { id: "feature" });
    await expect(
      applyFrameworkWidgetCutover(manifest, changed.adapter, persist),
    ).rejects.toThrow("changed after preparation");
    expect(changed.writes).toEqual([]);
  });
  it("validates every private descendant and disallows inline unmanaged media", async () => {
    const s = setup();
    s.put("website-builder.widget", {
      ...s.get("website-builder.widget", "secret"),
      description: { en: '<img src="https://example.test/secret.png">' },
    });
    await expect(s.prepare()).rejects.toThrow("Inline private media");
    expect(s.writes).toEqual([]);
  });
  it("refuses a duplicate contact root or an unrelated subscription requirement added after prepare", async () => {
    const duplicate = setup();
    duplicate.put("host.widgets-to-external-widgets", {
      id: "direct-contact",
      widgetId: "host-contact",
      externalModule: "website-builder",
      externalWidgetId: "hero",
      variant: "default",
    });
    await expect(duplicate.prepare()).rejects.toThrow("also renders");
    const changed = setup();
    const manifest = await changed.prepare();
    changed.put("blog.articles-to-ecommerce-module-products", {
      id: "other-subscription",
      articleId: "article",
      ecommerceModuleProductId: "other-product",
      variant: "subscription",
    });
    await expect(
      applyFrameworkWidgetCutover(manifest, changed.adapter, persist),
    ).rejects.toThrow("subscription requirements changed");
    expect(changed.writes).toEqual([]);
  });
  it("checks incoming ownership beyond the first page of private descendants", async () => {
    const s = setup();
    for (let index = 0; index < 101; index++) {
      const featureId = `feature-${String(index).padStart(3, "0")}`;
      s.put("website-builder.feature", { id: featureId });
      s.put("website-builder.widgets-to-features", {
        id: `edge-${String(index).padStart(3, "0")}`,
        widgetId: "secret",
        featureId,
      });
    }
    s.put("website-builder.widgets-to-features", {
      id: "outside-last-page",
      widgetId: "hero",
      featureId: "feature-100",
    });
    await expect(s.prepare()).rejects.toThrow("Shared private graph");
    expect(s.writes).toEqual([]);
  });
  it("freezes legacy periods only through the operator Subject SDK and recovers a lost response", async () => {
    const s = setup();
    const stamp = "2026-10-22T20:00:00.000Z";
    s.put("ecommerce.order", {
      id: "order",
      status: "delivering",
      type: "subscription",
      updatedAt: stamp,
    });
    s.put("rbac.subjects-to-ecommerce-module-orders", {
      id: "owner",
      subjectId: "subject",
      ecommerceModuleOrderId: "order",
    });
    const input = {
      freezeOrders: [
        { subjectId: "subject", orderId: "order", expectedUpdatedAt: stamp },
      ],
    };
    const manifest = await s.prepare(input);
    await expect(
      applyFrameworkWidgetCutover(manifest, s.adapter, persist),
    ).rejects.toThrow("freeze SDK is required");
    let calls = 0;
    const freeze = async (props: any) => {
      calls++;
      expect(props).toEqual({
        id: "subject",
        ecommerceModuleOrderId: "order",
        data: { expectedUpdatedAt: stamp },
      });
      s.put("ecommerce.order", {
        ...s.get("ecommerce.order", "order"),
        subscriptionPeriodStartsAt: stamp,
        subscriptionPeriodEndsAt: "2026-11-22T20:00:00.000Z",
        subscriptionPeriodInvoiceId: "paid-invoice",
        updatedAt: "2026-10-23T00:00:00.000Z",
      });
      throw Error("Unknown freeze outcome");
    };
    await expect(
      applyFrameworkWidgetCutover(manifest, s.adapter, persist, freeze),
    ).rejects.toThrow("Unknown freeze outcome");
    await applyFrameworkWidgetCutover(manifest, s.adapter, persist, freeze);
    expect(calls).toBe(1);
    await verifyFrameworkWidgetCutover(manifest, s.adapter);
    const repeat = await s.prepare(input);
    await applyFrameworkWidgetCutover(repeat, s.adapter, persist, freeze);
    expect(calls).toBe(1);
    expect(s.writes).toEqual([]);
  });
});

it.each([{ type: undefined }, { type: "one_off" }])(
  "rejects a non-subscription access Product (%j)",
  async ({ type }) => {
    const s = setup();
    s.put("ecommerce.product", {
      ...s.get("ecommerce.product", "subscription"),
      type,
    });
    await expect(s.prepare()).rejects.toThrow("not a subscription");
    expect(s.writes).toEqual([]);
  },
);

it.each(["apply", "rollback"])(
  "requires an exclusive CMS window for CLI %s before any API call",
  async (mode) => {
    await expect(
      frameworkWidgetCutoverCli([
        mode,
        "/tmp/nonexistent-framework-manifest.json",
      ]),
    ).rejects.toThrow("require --exclusive-maintenance");
  },
);
