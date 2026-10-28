import { randomUUID } from "node:crypto";
import { open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { API_SERVICE_URL } from "@sps/shared-utils";
import {
  applyWidgetCutover,
  rollbackWidgetCutover,
  cutoverApiOrigin,
  type IWidgetCutoverAdapter,
  type IWidgetCutoverManifest,
} from "./ai-chat-widget-links";

interface IRecord {
  id: string;
  [field: string]: any;
}
export interface IFrameworkWidgetInput {
  contact?: {
    hostLinkId: string;
    crmWidgetId: string;
    crmFormId: string;
    crmPresentationLinkId: string;
    sharedHeroWidgetId: string;
    anchor?: string;
  };
  privateArticles?: {
    articleId: string;
    articleWidgetLinkIds: string[];
    subscriptionProductId: string;
  }[];
  freezeOrders?: {
    subjectId: string;
    orderId: string;
    expectedUpdatedAt: string;
  }[];
}
export interface IFrameworkGraphReference {
  entity: string;
  column: string;
  target: string;
}
interface IPrivateGraph {
  articleId: string;
  articleWidgetLinkIds: string[];
  fingerprint: string;
}
interface IFreeze {
  subjectId: string;
  orderId: string;
  expectedUpdatedAt: string;
  before: IRecord;
  result?: IRecord;
}
export interface IFrameworkWidgetManifest extends IWidgetCutoverManifest {
  schema: "sps.framework-widget-cutover.v1";
  input: IFrameworkWidgetInput;
  privateGraphs: IPrivateGraph[];
  graphReferences: IFrameworkGraphReference[];
  freezes: IFreeze[];
}
export type IFrameworkFreeze = (props: {
  id: string;
  ecommerceModuleOrderId: string;
  data: { expectedUpdatedAt: string };
}) => Promise<{ accepted: boolean; order: IRecord }>;

const edges = [
  [
    "widget",
    "widgets-to-buttons-arrays",
    "widgetId",
    "buttons-array",
    "buttonsArrayId",
  ],
  ["widget", "widgets-to-features", "widgetId", "feature", "featureId"],
  [
    "widget",
    "widgets-to-file-storage-module-files",
    "widgetId",
    "file",
    "fileStorageModuleFileId",
  ],
  ["widget", "widgets-to-logotypes", "widgetId", "logotype", "logotypeId"],
  ["widget", "widgets-to-sliders", "widgetId", "slider", "sliderId"],
  ["slider", "sliders-to-slides", "sliderId", "slide", "slideId"],
  [
    "slide",
    "slides-to-buttons-arrays",
    "slideId",
    "buttons-array",
    "buttonsArrayId",
  ],
  [
    "slide",
    "slides-to-file-storage-module-files",
    "slideId",
    "file",
    "fileStorageModuleFileId",
  ],
  [
    "feature",
    "features-to-buttons-arrays",
    "featureId",
    "buttons-array",
    "buttonsArrayId",
  ],
  [
    "feature",
    "features-to-file-storage-module-files",
    "featureId",
    "file",
    "fileStorageModuleFileId",
  ],
  [
    "buttons-array",
    "buttons-arrays-to-buttons",
    "buttonsArrayId",
    "button",
    "buttonId",
  ],
  [
    "button",
    "buttons-to-file-storage-module-files",
    "buttonId",
    "file",
    "fileStorageModuleFileId",
  ],
  [
    "logotype",
    "logotypes-to-file-storage-module-files",
    "logotypeId",
    "file",
    "fileStorageModuleFileId",
  ],
] as const;
const entityFor = (model: string) =>
  `${model === "file" ? "file-storage" : "website-builder"}.${model}`;
const stable = (value: unknown): string => {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
};
const matches = (row: any, data: any) =>
  Boolean(row) &&
  Object.entries(data).every(
    ([key, value]) => stable(row[key]) === stable(value),
  );
const writable = (row: any) =>
  Object.fromEntries(
    Object.entries(row).filter(
      ([key]) => !["id", "createdAt", "updatedAt"].includes(key),
    ),
  );
const stringValues = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : value && typeof value === "object"
      ? Object.values(value).flatMap(stringValues)
      : [];
async function find(
  adapter: IWidgetCutoverAdapter,
  entity: string,
  selector: Record<string, unknown>,
): Promise<IRecord[]> {
  const result: IRecord[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await (
      await adapter(entity)
    ).find({
      params: {
        limit: 100,
        offset,
        orderBy: { and: [{ column: "id", method: "asc" }] },
        filters: {
          and: Object.entries(selector).map(([column, value]) => ({
            column,
            method: "eq",
            value,
          })),
        },
      },
    });
    if (!Array.isArray(page))
      throw Error(`Unreadable SDK collection ${entity}`);
    if (page.some((row) => result.some((previous) => previous.id === row.id)))
      throw Error(`Unstable pagination ${entity}`);
    result.push(...(page as IRecord[]));
    if (page.length < 100) return result;
  }
}
async function required(
  adapter: IWidgetCutoverAdapter,
  entity: string,
  id: string,
) {
  const rows = await find(adapter, entity, { id });
  if (rows.length !== 1) throw Error(`Expected exact ${entity}:${id}`);
  return rows[0];
}

async function assertSingleContactRoot(
  adapter: IWidgetCutoverAdapter,
  target: NonNullable<IFrameworkWidgetInput["contact"]>,
) {
  const host = await required(
    adapter,
    "host.widgets-to-external-widgets",
    target.hostLinkId,
  );
  const slug = `framework-contact-${target.crmWidgetId}`;
  const frames = await find(adapter, "website-builder.widget", { slug });
  const functional = await find(adapter, "rbac.widget", { slug });
  const frameIds = new Set([
    target.sharedHeroWidgetId,
    ...frames.map((row) => row.id),
  ]);
  const functionalIds = new Set(functional.map((row) => row.id));
  const duplicates = (
    await find(adapter, "host.widgets-to-external-widgets", {
      widgetId: host.widgetId,
    })
  ).filter(
    (row) =>
      row.id !== host.id &&
      row.variant !== "hidden" &&
      ((row.externalModule === "crm" &&
        row.externalWidgetId === target.crmWidgetId) ||
        (row.externalModule === "website-builder" &&
          frameIds.has(row.externalWidgetId)) ||
        (row.externalModule === "rbac" &&
          functionalIds.has(row.externalWidgetId))),
  );
  if (duplicates.length)
    throw Error(
      "Contact Host Widget also renders the selected content directly; preserve and retire the exact duplicate association first",
    );
}

/** Registry metadata only; every content record is read through its owning SDK. */
export async function frameworkGraphReferences(): Promise<
  IFrameworkGraphReference[]
> {
  const { listContentEntityDescriptors } = await import(
    "../../apps/mcp/lib/content-management/registry"
  );
  const references: IFrameworkGraphReference[] = [];
  for (const descriptor of await listContentEntityDescriptors()) {
    if (descriptor.kind !== "relation") continue;
    for (const model of [
      "widget",
      "slider",
      "slide",
      "feature",
      "buttons-array",
      "button",
      "logotype",
      "file",
    ]) {
      const pascal = model
        .split("-")
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join("");
      const column =
        model === "file"
          ? descriptor.module === "file-storage"
            ? "fileId"
            : "fileStorageModuleFileId"
          : descriptor.module === "website-builder"
            ? `${pascal[0].toLowerCase()}${pascal.slice(1)}Id`
            : `websiteBuilderModule${pascal}Id`;
      if (descriptor.fields.some((field) => field.name === column))
        references.push({
          entity: descriptor.key,
          column,
          target: entityFor(model),
        });
    }
  }
  return references;
}

async function privateGraph(
  adapter: IWidgetCutoverAdapter,
  target: IFrameworkWidgetInput["privateArticles"] extends
    | (infer T)[]
    | undefined
    ? T
    : never,
  references: IFrameworkGraphReference[],
  observe: (entity: string, record: IRecord) => void,
) {
  const allowedRoots = new Set(target.articleWidgetLinkIds);
  const nodes = new Map<string, { model: string; row: IRecord }>();
  const graphEdges = new Set<string>();
  const rootLinks: IRecord[] = [];
  for (const id of target.articleWidgetLinkIds) {
    const link = await required(
      adapter,
      "blog.articles-to-website-builder-module-widgets",
      id,
    );
    if (
      link.articleId !== target.articleId ||
      !["default", "private"].includes(link.variant)
    )
      throw Error(`Article binding differs: ${id}`);
    rootLinks.push(link);
    observe("blog.articles-to-website-builder-module-widgets", link);
  }
  const queue = rootLinks.map((link) => ({
    model: "widget",
    id: String(link.websiteBuilderModuleWidgetId),
  }));
  while (queue.length) {
    const item = queue.shift()!;
    const entity = entityFor(item.model);
    const key = `${entity}:${item.id}`;
    if (nodes.has(key)) continue;
    const row = await required(adapter, entity, item.id);
    observe(entity, row);
    nodes.set(key, { model: item.model, row });
    if (
      item.model === "file" &&
      (typeof row.file !== "string" ||
        !/^\/file-storage\/[A-Za-z0-9_./-]+$/.test(row.file) ||
        row.file.split("/").includes(".."))
    )
      throw Error(`Private media needs a distinct managed copy: ${item.id}`);
    if (
      stringValues(row).some((value) =>
        /(?:src|poster)\s*=|\burl\s*\(|<object\b[^>]*\bdata\s*=/i.test(value),
      )
    )
      throw Error(
        `Inline private media must use managed File relations: ${key}`,
      );
    for (const [
      source,
      relation,
      sourceColumn,
      destination,
      targetColumn,
    ] of edges) {
      if (source !== item.model) continue;
      const relationEntity = `website-builder.${relation}`;
      for (const edge of await find(adapter, relationEntity, {
        [sourceColumn]: item.id,
      })) {
        observe(relationEntity, edge);
        graphEdges.add(`${relationEntity}:${edge.id}`);
        queue.push({ model: destination, id: String(edge[targetColumn]) });
      }
    }
  }
  for (const [key, node] of nodes) {
    const entity = entityFor(node.model);
    for (const reference of references.filter((ref) => ref.target === entity)) {
      for (const incoming of await find(adapter, reference.entity, {
        [reference.column]: node.row.id,
      })) {
        const edgeKey = `${reference.entity}:${incoming.id}`;
        if (
          graphEdges.has(edgeKey) ||
          (reference.entity ===
            "blog.articles-to-website-builder-module-widgets" &&
            allowedRoots.has(incoming.id))
        )
          continue;
        throw Error(
          `Shared private graph ${key} via ${edgeKey}; fork/relink exact managed copies before prepare`,
        );
      }
    }
    if (
      node.model === "widget" &&
      (
        await find(adapter, "host.widgets-to-external-widgets", {
          externalModule: "website-builder",
          externalWidgetId: node.row.id,
        })
      ).length
    )
      throw Error(`Private Widget is also linked from Host: ${node.row.id}`);
  }
  return stable({
    nodes: [...nodes.keys()].sort(),
    edges: [...graphEdges].sort(),
    roots: target.articleWidgetLinkIds.slice().sort(),
  });
}

/** Exact-ID, read-only preparation. Shared private graphs are refused, never marked. */
export async function prepareFrameworkWidgetCutover(
  input: IFrameworkWidgetInput,
  adapter: IWidgetCutoverAdapter,
  references?: IFrameworkGraphReference[],
): Promise<IFrameworkWidgetManifest> {
  if (
    !input.contact &&
    !input.privateArticles?.length &&
    !input.freezeOrders?.length
  )
    throw Error(
      "Provide explicit contact, private Article or legacy Order targets",
    );
  if (
    input.contact &&
    [
      input.contact.hostLinkId,
      input.contact.crmWidgetId,
      input.contact.crmFormId,
      input.contact.crmPresentationLinkId,
      input.contact.sharedHeroWidgetId,
    ].some((id) => typeof id !== "string" || !id.trim())
  )
    throw Error("Provide explicit contact association, Widget and Form IDs");
  if (
    input.privateArticles?.some(
      (target) =>
        !target.articleId ||
        !target.subscriptionProductId ||
        !target.articleWidgetLinkIds?.length ||
        new Set(target.articleWidgetLinkIds).size !==
          target.articleWidgetLinkIds.length,
    ) ||
    new Set(input.privateArticles?.map((target) => target.articleId)).size !==
      (input.privateArticles?.length ?? 0)
  )
    throw Error("Provide distinct explicit Article and association IDs");
  const manifest: IFrameworkWidgetManifest = {
    schema: "sps.framework-widget-cutover.v1",
    input: structuredClone(input),
    createdAt: new Date().toISOString(),
    status: "prepared",
    checks: [],
    operations: [],
    privateGraphs: [],
    graphReferences:
      references ??
      (input.privateArticles?.length ? await frameworkGraphReferences() : []),
    freezes: [],
  };
  const observe = (entity: string, record: IRecord) => {
    if (
      !manifest.checks.some(
        (check) => check.entity === entity && check.record.id === record.id,
      )
    )
      manifest.checks.push({ entity, record });
  };
  const read = async (entity: string, id: string) => {
    const row = await required(adapter, entity, id);
    observe(entity, row);
    return row;
  };
  const ensure = async (
    entity: string,
    selector: Record<string, unknown>,
    data: Record<string, unknown>,
    retainOnRollback = false,
  ) => {
    const pending = manifest.operations.find(
      (operation) =>
        operation.entity === entity &&
        !operation.before &&
        matches(operation.data, selector),
    );
    if (pending) return pending.data as IRecord;
    const existing = await find(adapter, entity, selector);
    if (
      existing.length > 1 ||
      (existing.length === 1 && !matches(existing[0], data))
    )
      throw Error(`Existing ${entity} differs from requested configuration`);
    if (existing.length) {
      observe(entity, existing[0]);
      return existing[0];
    }
    const row = { id: randomUUID(), ...data };
    manifest.operations.push({
      entity,
      id: row.id,
      before: null,
      data: row,
      selector,
      retainOnRollback,
    });
    return row as IRecord;
  };
  const switches: IWidgetCutoverManifest["operations"] = [];
  if (input.contact) {
    const target = input.contact;
    await assertSingleContactRoot(adapter, target);
    const host = await read(
      "host.widgets-to-external-widgets",
      target.hostLinkId,
    );
    const crm = await read("crm.widget", target.crmWidgetId);
    const form = await read("crm.form", target.crmFormId);
    const hero = await read(
      "website-builder.widget",
      target.sharedHeroWidgetId,
    );
    const oldFrame = await read(
      "crm.widgets-to-website-builder-module-widgets",
      target.crmPresentationLinkId,
    );
    if (host.variant !== "default" || oldFrame.widgetId !== crm.id)
      throw Error("Contact associations must match the explicit owners");
    const forms = await find(adapter, "crm.widgets-to-forms", {
      widgetId: crm.id,
    });
    if (!forms.some((link) => link.formId === form.id))
      throw Error("Selected Form is not linked to the selected CRM Widget");
    for (const link of forms) observe("crm.widgets-to-forms", link);
    const slug = `framework-contact-${crm.id}`;
    const frame = await ensure(
      "website-builder.widget",
      { slug },
      {
        slug,
        variant: "content-feature-find-row",
        adminTitle: crm.adminTitle,
        title: form.title ?? {},
        subtitle: form.subtitle ?? {},
        description: form.description ?? {},
        className: crm.className ?? null,
        anchor: target.anchor ?? crm.slug,
      },
    );
    const functional = await ensure(
      "rbac.widget",
      { slug },
      {
        slug,
        variant: "subject-me-crm-module-form-request-create",
        adminTitle: crm.adminTitle,
      },
    );
    for (const [entity, column, id] of [
      [
        "rbac.widgets-to-website-builder-module-widgets",
        "websiteBuilderModuleWidgetId",
        frame.id,
      ],
      ["rbac.widgets-to-crm-module-widgets", "crmModuleWidgetId", crm.id],
    ] as const) {
      const current = await find(adapter, entity, { widgetId: functional.id });
      if (
        current.some(
          (link) => link[column] !== id || link.variant !== "default",
        )
      )
        throw Error(`Functional Widget has different configuration: ${entity}`);
      await ensure(
        entity,
        { widgetId: functional.id, [column]: id },
        {
          widgetId: functional.id,
          [column]: id,
          variant: "default",
          orderIndex: 0,
        },
      );
    }
    if (![hero.id, frame.id].includes(oldFrame.websiteBuilderModuleWidgetId))
      throw Error(
        "CRM presentation differs from the explicit shared hero/fork",
      );
    if (oldFrame.websiteBuilderModuleWidgetId !== frame.id)
      manifest.operations.push({
        entity: "crm.widgets-to-website-builder-module-widgets",
        id: oldFrame.id,
        before: oldFrame,
        data: { websiteBuilderModuleWidgetId: frame.id },
      });
    await ensure(
      "host.widgets-to-external-widgets",
      {
        widgetId: host.widgetId,
        externalModule: "crm",
        externalWidgetId: crm.id,
        variant: "hidden",
      },
      {
        widgetId: host.widgetId,
        externalModule: "crm",
        externalWidgetId: crm.id,
        variant: "hidden",
        orderIndex: host.orderIndex ?? 0,
        className: host.className ?? null,
      },
    );
    if (
      !(
        host.externalModule === "rbac" &&
        host.externalWidgetId === functional.id
      )
    ) {
      if (host.externalModule !== "crm" || host.externalWidgetId !== crm.id)
        throw Error(
          "Host contact binding does not match the selected CRM Widget",
        );
      switches.push({
        entity: "host.widgets-to-external-widgets",
        id: host.id,
        before: host,
        data: { externalModule: "rbac", externalWidgetId: functional.id },
      });
    }
  }
  for (const target of input.privateArticles ?? []) {
    await read("blog.article", target.articleId);
    const product = await read(
      "ecommerce.product",
      target.subscriptionProductId,
    );
    if (product.type !== "subscription")
      throw Error("Selected Product is not a subscription");
    const roles = await find(
      adapter,
      "rbac.roles-to-ecommerce-module-products",
      { ecommerceModuleProductId: target.subscriptionProductId },
    );
    if (!roles.length)
      throw Error(
        "Subscription Product needs explicit linked Roles before marking private content",
      );
    for (const link of roles) {
      observe("rbac.roles-to-ecommerce-module-products", link);
      await read("rbac.role", String(link.roleId));
    }
    const fingerprint = await privateGraph(
      adapter,
      target,
      manifest.graphReferences,
      observe,
    );
    manifest.privateGraphs.push({
      articleId: target.articleId,
      articleWidgetLinkIds: target.articleWidgetLinkIds,
      fingerprint,
    });
    const requirements = await find(
      adapter,
      "blog.articles-to-ecommerce-module-products",
      { articleId: target.articleId, variant: "subscription" },
    );
    if (
      requirements.some(
        (row) => row.ecommerceModuleProductId !== target.subscriptionProductId,
      )
    )
      throw Error(
        "Article has other subscription requirements; review its exact access configuration before this cutover",
      );
    await ensure(
      "blog.articles-to-ecommerce-module-products",
      {
        articleId: target.articleId,
        ecommerceModuleProductId: target.subscriptionProductId,
        variant: "subscription",
      },
      {
        articleId: target.articleId,
        ecommerceModuleProductId: target.subscriptionProductId,
        variant: "subscription",
        orderIndex: 0,
      },
      true,
    );
    for (const id of target.articleWidgetLinkIds) {
      const link = await read(
        "blog.articles-to-website-builder-module-widgets",
        id,
      );
      if (link.variant !== "private")
        manifest.operations.push({
          entity: "blog.articles-to-website-builder-module-widgets",
          id,
          before: link,
          data: { variant: "private" },
          retainOnRollback: true,
        });
    }
  }
  for (const target of input.freezeOrders ?? []) {
    if (manifest.freezes.some((freeze) => freeze.orderId === target.orderId))
      throw Error("Duplicate legacy Order freeze target");
    const order = await required(adapter, "ecommerce.order", target.orderId);
    const frozen =
      order.subscriptionPeriodInvoiceId &&
      order.subscriptionPeriodEndsAt &&
      new Date(order.subscriptionPeriodStartsAt).toISOString() ===
        new Date(target.expectedUpdatedAt).toISOString();
    if (
      !frozen &&
      new Date(order.updatedAt).toISOString() !==
        new Date(target.expectedUpdatedAt).toISOString()
    )
      throw Error("Stale legacy Order before freeze");
    const owners = await find(
      adapter,
      "rbac.subjects-to-ecommerce-module-orders",
      { subjectId: target.subjectId, ecommerceModuleOrderId: target.orderId },
    );
    if (owners.length !== 1)
      throw Error("Legacy Order does not have the explicit Subject owner");
    observe("rbac.subjects-to-ecommerce-module-orders", owners[0]);
    manifest.freezes.push({
      ...target,
      before: order,
      ...(frozen ? { result: order } : {}),
    });
  }
  manifest.operations.push(...switches);
  return manifest;
}

async function validateGraphs(
  manifest: IFrameworkWidgetManifest,
  adapter: IWidgetCutoverAdapter,
) {
  if (manifest.input.contact)
    await assertSingleContactRoot(adapter, manifest.input.contact);
  for (const graph of manifest.privateGraphs) {
    const target = manifest.input.privateArticles!.find(
      (item) => item.articleId === graph.articleId,
    )!;
    const fingerprint = await privateGraph(
      adapter,
      target,
      manifest.graphReferences,
      () => {},
    );
    if (fingerprint !== graph.fingerprint)
      throw Error("Private graph changed after preparation");
    const requirements = await find(
      adapter,
      "blog.articles-to-ecommerce-module-products",
      { articleId: graph.articleId, variant: "subscription" },
    );
    if (
      requirements.some(
        (row) => row.ecommerceModuleProductId !== target.subscriptionProductId,
      )
    )
      throw Error(
        "Article subscription requirements changed after preparation",
      );
  }
}
export async function applyFrameworkWidgetCutover(
  manifest: IFrameworkWidgetManifest,
  adapter: IWidgetCutoverAdapter,
  persist: (manifest: IFrameworkWidgetManifest) => Promise<void>,
  freeze?: IFrameworkFreeze,
) {
  if (
    manifest.schema !== "sps.framework-widget-cutover.v1" ||
    ["rolled-back", "rolling-back"].includes(manifest.status)
  )
    throw Error("Cannot apply this Framework manifest");
  await validateGraphs(manifest, adapter);
  if (manifest.status === "prepared")
    for (const check of manifest.checks) {
      if (
        stable(
          await required(adapter, check.entity, String(check.record.id)),
        ) !== stable(check.record)
      )
        throw Error(
          `Stale before manifest: ${check.entity}:${check.record.id}`,
        );
    }
  if (manifest.freezes.length && !freeze)
    throw Error("Operator Subject freeze SDK is required");
  for (const item of manifest.freezes) {
    const current = await required(adapter, "ecommerce.order", item.orderId);
    if (item.result) {
      if (stable(current) !== stable(item.result))
        throw Error("Frozen Order changed after cutover");
      continue;
    }
    const recovered =
      current.subscriptionPeriodInvoiceId &&
      current.subscriptionPeriodEndsAt &&
      new Date(current.subscriptionPeriodStartsAt).toISOString() ===
        new Date(item.expectedUpdatedAt).toISOString();
    if (!recovered) {
      if (stable(current) !== stable(item.before))
        throw Error("Legacy Order changed before freeze");
      await persist(manifest);
      await freeze!({
        id: item.subjectId,
        ecommerceModuleOrderId: item.orderId,
        data: { expectedUpdatedAt: item.expectedUpdatedAt },
      });
    }
    const saved = await required(adapter, "ecommerce.order", item.orderId);
    if (
      !saved.subscriptionPeriodInvoiceId ||
      !saved.subscriptionPeriodEndsAt ||
      new Date(saved.subscriptionPeriodStartsAt).toISOString() !==
        new Date(item.expectedUpdatedAt).toISOString()
    )
      throw Error("Legacy freeze readback failed");
    item.result = saved;
    await persist(manifest);
  }
  return applyWidgetCutover(manifest, adapter, (value) =>
    persist(value as IFrameworkWidgetManifest),
  );
}
export async function verifyFrameworkWidgetCutover(
  manifest: IFrameworkWidgetManifest,
  adapter: IWidgetCutoverAdapter,
) {
  if (
    manifest.schema !== "sps.framework-widget-cutover.v1" ||
    manifest.status !== "applied"
  )
    throw Error("Framework manifest is not applied");
  await validateGraphs(manifest, adapter);
  for (const operation of manifest.operations) {
    if (
      !operation.result ||
      stable(await required(adapter, operation.entity, operation.id)) !==
        stable(operation.result)
    )
      throw Error(
        `Managed record differs: ${operation.entity}:${operation.id}`,
      );
  }
  for (const check of manifest.checks) {
    if (
      manifest.operations.some(
        (operation) =>
          operation.entity === check.entity && operation.id === check.record.id,
      )
    )
      continue;
    if (
      stable(await required(adapter, check.entity, String(check.record.id))) !==
      stable(check.record)
    )
      throw Error(`Source record differs: ${check.entity}:${check.record.id}`);
  }
  for (const item of manifest.freezes)
    if (
      !item.result ||
      stable(await required(adapter, "ecommerce.order", item.orderId)) !==
        stable(item.result)
    )
      throw Error(`Frozen Order differs: ${item.orderId}`);
  return {
    operations: manifest.operations.length,
    privateGraphs: manifest.privateGraphs.length,
    frozenOrders: manifest.freezes.length,
  };
}
export async function rollbackFrameworkWidgetCutover(
  manifest: IFrameworkWidgetManifest,
  adapter: IWidgetCutoverAdapter,
  persist: (manifest: IFrameworkWidgetManifest) => Promise<void>,
) {
  if (manifest.schema !== "sps.framework-widget-cutover.v1")
    throw Error("Unknown Framework manifest");
  for (const operation of manifest.operations) {
    if (
      !operation.before ||
      operation.rolledBack ||
      operation.retainOnRollback ||
      !operation.result
    )
      continue;
    const current = await required(adapter, operation.entity, operation.id);
    if (
      stable(current) !== stable(operation.result) &&
      stable(writable(current)) !== stable(writable(operation.before))
    )
      throw Error("Refusing concurrent edit during Framework rollback");
  }
  await rollbackWidgetCutover(manifest, adapter, (value) =>
    persist(value as IFrameworkWidgetManifest),
  );
}

export async function frameworkWidgetCutoverCli(args = process.argv.slice(2)) {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      "allow-api-origin": { type: "string" },
      "exclusive-maintenance": { type: "boolean", default: false },
    },
  });
  const [mode, inputPath, manifestPath] = positionals;
  if (
    !["prepare", "apply", "verify", "rollback"].includes(mode) ||
    !inputPath ||
    positionals.length !== (mode === "prepare" ? 3 : 2)
  )
    throw Error(
      "Usage: framework-widget-links.ts prepare <explicit-input.json> <new-manifest.json> | apply|verify|rollback <manifest.json>",
    );
  if (["apply", "rollback"].includes(mode) && !values["exclusive-maintenance"])
    throw Error(
      "Apply and rollback require --exclusive-maintenance with other CMS writers stopped for this API origin",
    );
  if (!process.env.RBAC_SECRET_KEY)
    throw Error("Operator SDK credentials are required");
  const origin = cutoverApiOrigin(
    API_SERVICE_URL ?? "",
    values["allow-api-origin"],
  );
  const { getContentEntityDescriptor } = await import(
    "../../apps/mcp/lib/content-management/registry"
  );
  const options = {
    cache: "no-store" as const,
    headers: {
      "X-RBAC-SECRET-KEY": process.env.RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    },
  };
  const adapter: IWidgetCutoverAdapter = async (entity) => {
    const descriptor = await getContentEntityDescriptor(entity);
    if (!descriptor) throw Error(`Unknown SDK entity ${entity}`);
    return Object.fromEntries(
      Object.entries(descriptor.api).map(([key, value]) => [
        key,
        typeof value === "function"
          ? (props: any) => value({ ...props, host: origin.origin, options })
          : value,
      ]),
    ) as any;
  };
  const destination = mode === "prepare" ? manifestPath : inputPath;
  const lock = await open(`${destination}.lock`, "wx");
  const persist = async (manifest: IFrameworkWidgetManifest) => {
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(manifest, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(temporary, destination);
  };
  try {
    if (mode === "prepare") {
      try {
        await readFile(destination);
        throw Error("Before manifest already exists");
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
      const manifest = await prepareFrameworkWidgetCutover(
        JSON.parse(await readFile(inputPath, "utf8")),
        adapter,
      );
      manifest.apiOrigin = origin.origin;
      await persist(manifest);
      console.log({
        operations: manifest.operations.length,
        frozenOrders: manifest.freezes.length,
      });
    } else {
      const manifest: IFrameworkWidgetManifest = JSON.parse(
        await readFile(inputPath, "utf8"),
      );
      if (
        manifest.schema !== "sps.framework-widget-cutover.v1" ||
        manifest.apiOrigin !== origin.origin
      )
        throw Error("Manifest does not belong to this migration/API");
      if (mode === "verify")
        console.log(await verifyFrameworkWidgetCutover(manifest, adapter));
      else if (mode === "rollback")
        await rollbackFrameworkWidgetCutover(manifest, adapter, persist);
      else {
        const { api: subjectApi } = await import(
          "@sps/rbac/models/subject/sdk/server"
        );
        console.log(
          await applyFrameworkWidgetCutover(
            manifest,
            adapter,
            persist,
            (props) =>
              subjectApi.ecommerceModuleOrderFreezeSubscriptionPeriod({
                ...props,
                host: origin.origin,
                options,
              }) as any,
          ),
        );
      }
    }
  } finally {
    await lock.close();
    await unlink(`${destination}.lock`);
  }
}
if (import.meta.main)
  frameworkWidgetCutoverCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
