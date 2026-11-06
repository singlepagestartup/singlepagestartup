import { createHash, randomUUID } from "node:crypto";
import { open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { API_SERVICE_URL } from "@sps/shared-utils";
import type { IWidgetCutoverAdapter } from "./ai-chat-widget-links";
import { frameworkGraphReferences } from "./framework-widget-links";

interface IRecord {
  id: string;
  [field: string]: any;
}
interface ILocalized {
  en: string;
  ru: string;
}
interface ICopy {
  slug: string;
  adminTitle: string;
  title: ILocalized;
  subtitle: ILocalized;
  description: ILocalized;
}
export interface IBlogExampleInput {
  schema: "sps.blog-example-content-input.v1";
  categories: (ICopy & { id: string })[];
  articles: (ICopy & {
    key: string;
    id?: string;
    categoryId: string;
    coverFileId: string;
  })[];
  author: {
    slug: string;
    title: ILocalized;
    subtitle?: ILocalized;
    description?: ILocalized;
    avatarFileId: string;
  };
  articleWidgets: { widgetId: string; articleKeys: string[] }[];
  categoryWidgets: { widgetId: string; categoryIds: string[] }[];
  deleteArticles: { id: string; slug: string }[];
  protectedArticleIds: string[];
  publicReadPaths: string[];
}
export interface IBlogReference {
  entity: string;
  column: string;
  target: string;
}
interface IObserved {
  entity: string;
  row: IRecord;
}
interface IOperation {
  key: string;
  action: "create" | "update" | "delete";
  entity: string;
  id: string;
  selector: Record<string, unknown>;
  data?: Record<string, unknown>;
  before?: IRecord;
  phase: "publish" | "retire";
  state: "pending" | "started" | "done";
  result?: IRecord;
}
export interface IBlogExampleManifest {
  schema: "sps.blog-example-content-manifest.v1";
  apiOrigin?: string;
  input: IBlogExampleInput;
  createdAt: string;
  references: IBlogReference[];
  operations: IOperation[];
  articles: Record<string, string>;
  authorId: string;
  protectedFingerprint: string;
  protectedRecords: IObserved[];
  assets: IObserved[];
  deletion: { article: IRecord; cascades: IObserved[] }[];
  unchanged: IObserved[];
}
const publicPaths = new Set([
  "/api/social/profiles-to-blog-module-articles",
  "/api/social/profiles-to-file-storage-module-files",
]);
const protectedEdges = [
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
const fingerprint = (value: unknown) =>
  createHash("sha256").update(stable(value)).digest("hex");
const writable = (row: IRecord) =>
  Object.fromEntries(
    Object.entries(row).filter(
      ([key]) => !["id", "createdAt", "updatedAt"].includes(key),
    ),
  );
const matches = (row: IRecord | undefined, data: Record<string, unknown>) =>
  Boolean(row) &&
  Object.entries(data).every(
    ([key, value]) => stable(row![key]) === stable(value),
  );
const unique = (items: string[], label: string) => {
  if (new Set(items).size !== items.length) throw Error(`Duplicate ${label}`);
};
async function find(
  adapter: IWidgetCutoverAdapter,
  entity: string,
  selector: Record<string, unknown> = {},
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
async function exact(
  adapter: IWidgetCutoverAdapter,
  entity: string,
  id: string,
) {
  const rows = await find(adapter, entity, { id });
  if (rows.length !== 1) throw Error(`Expected exact ${entity}:${id}`);
  return rows[0];
}
function validate(input: IBlogExampleInput) {
  if (
    input.schema !== "sps.blog-example-content-input.v1" ||
    input.categories?.length !== 3 ||
    input.articles?.length !== 6 ||
    input.deleteArticles?.length !== 8 ||
    input.protectedArticleIds?.length !== 1
  )
    throw Error(
      "Expected three categories, six articles, eight exact retirements and one protected article",
    );
  unique(
    input.categories.map((row) => row.id),
    "category IDs",
  );
  unique(
    input.categories.map((row) => row.slug),
    "category slugs",
  );
  unique(
    input.articles.map((row) => row.key),
    "article keys",
  );
  unique(
    input.articles.map((row) => row.slug),
    "article slugs",
  );
  unique(
    input.deleteArticles.map((row) => row.id),
    "retirement IDs",
  );
  unique(
    input.deleteArticles.map((row) => row.slug),
    "retirement slugs",
  );
  unique(input.publicReadPaths, "public read paths");
  if (input.publicReadPaths.some((path) => !publicPaths.has(path)))
    throw Error(
      "Only the two explicit author metadata GET paths are supported",
    );
  if (!input.author?.slug || input.author.slug !== "sps-editorial")
    throw Error("Expected the explicit sps-editorial author");
  if (!input.author.title?.en || !input.author.title?.ru)
    throw Error("The editorial author requires EN/RU titles");
  const protectedIds = new Set(input.protectedArticleIds);
  const existing = input.articles.filter((row) => row.id);
  if (existing.length !== 1 || !protectedIds.has(existing[0].id!))
    throw Error("Only the protected existing Article may have an explicit ID");
  for (const row of input.categories) {
    if (
      input.articles.filter((article) => article.categoryId === row.id)
        .length !== 2
    )
      throw Error(`Category requires exactly two articles: ${row.id}`);
  }
  for (const row of [...input.categories, ...input.articles]) {
    if (
      !row.slug ||
      !row.adminTitle ||
      !row.title?.en ||
      !row.title?.ru ||
      !row.subtitle?.en ||
      !row.subtitle?.ru
    )
      throw Error(
        "Complete EN/RU title, subtitle, slug and adminTitle are required",
      );
    for (const locale of ["en", "ru"] as const) {
      let doc: any;
      try {
        doc = JSON.parse(row.description[locale]);
      } catch {
        throw Error(`Invalid ${locale} TipTap JSON for ${row.slug}`);
      }
      if (
        doc.type !== "doc" ||
        !Array.isArray(doc.content) ||
        !doc.content.length
      )
        throw Error(`Empty ${locale} TipTap document for ${row.slug}`);
    }
  }
  const deleted = new Set(input.deleteArticles.map((row) => row.id));
  if (
    input.articles.some((row) => deleted.has(row.id!)) ||
    input.protectedArticleIds.some((id) => deleted.has(id)) ||
    input.articles.some((row) =>
      input.deleteArticles.some((old) => old.slug === row.slug),
    )
  )
    throw Error("Retirement overlaps a managed/protected Article");
  const keys = new Set(input.articles.map((row) => row.key));
  const categories = new Set(input.categories.map((row) => row.id));
  if (!input.articleWidgets.length || !input.categoryWidgets.length)
    throw Error("Explicit curated Widgets are required");
  unique(
    input.articleWidgets.map((row) => row.widgetId),
    "article Widget IDs",
  );
  unique(
    input.categoryWidgets.map((row) => row.widgetId),
    "category Widget IDs",
  );
  for (const row of input.articleWidgets) {
    unique(row.articleKeys, "curated article keys");
    if (
      !row.articleKeys.length ||
      row.articleKeys.some((key) => !keys.has(key))
    )
      throw Error("Unknown curated Article key");
  }
  for (const row of input.categoryWidgets) {
    unique(row.categoryIds, "curated category IDs");
    if (
      !row.categoryIds.length ||
      row.categoryIds.some((id) => !categories.has(id))
    )
      throw Error("Unknown curated Category ID");
  }
}

/** Registry metadata supplies all incoming Article/WB/File relation kinds. */
export async function blogExampleReferences(): Promise<IBlogReference[]> {
  const { listContentEntityDescriptors } = await import(
    "../../apps/mcp/lib/content-management/registry"
  );
  const result: IBlogReference[] = await frameworkGraphReferences();
  for (const descriptor of await listContentEntityDescriptors()) {
    if (descriptor.kind !== "relation") continue;
    const column =
      descriptor.module === "blog" ? "articleId" : "blogModuleArticleId";
    if (descriptor.fields.some((field) => field.name === column))
      result.push({ entity: descriptor.key, column, target: "blog.article" });
  }
  return result;
}
async function incoming(
  adapter: IWidgetCutoverAdapter,
  references: IBlogReference[],
  entity: string,
  id: string,
): Promise<IObserved[]> {
  const results: IObserved[] = [];
  for (const ref of references.filter((row) => row.target === entity)) {
    for (const row of await find(adapter, ref.entity, { [ref.column]: id }))
      results.push({ entity: ref.entity, row });
  }
  return results.sort((a, b) =>
    `${a.entity}:${a.row.id}`.localeCompare(`${b.entity}:${b.row.id}`),
  );
}
async function protectedGraph(
  input: IBlogExampleInput,
  adapter: IWidgetCutoverAdapter,
  refs: IBlogReference[],
) {
  const records = new Map<string, IObserved>();
  const keep = (entity: string, row: IRecord) =>
    records.set(`${entity}:${row.id}`, { entity, row });
  const queue: { model: string; id: string }[] = [];
  for (const articleId of input.protectedArticleIds) {
    const roots = await find(
      adapter,
      "blog.articles-to-website-builder-module-widgets",
      { articleId },
    );
    if (!roots.length || roots.some((row) => row.variant !== "private"))
      throw Error(
        `Protected Article requires existing private Widget bindings: ${articleId}`,
      );
    for (const row of roots) {
      keep("blog.articles-to-website-builder-module-widgets", row);
      queue.push({ model: "widget", id: row.websiteBuilderModuleWidgetId });
    }
    const requirements = await find(
      adapter,
      "blog.articles-to-ecommerce-module-products",
      { articleId },
    );
    if (!requirements.some((row) => row.variant === "subscription"))
      throw Error(
        `Protected Article has no subscription requirement: ${articleId}`,
      );
    for (const row of requirements)
      keep("blog.articles-to-ecommerce-module-products", row);
  }
  const visited = new Set<string>();
  while (queue.length) {
    const { model, id } = queue.shift()!;
    const entity = entityFor(model);
    const key = `${entity}:${id}`;
    if (visited.has(key)) continue;
    visited.add(key);
    keep(entity, await exact(adapter, entity, id));
    for (const item of await incoming(adapter, refs, entity, id))
      keep(item.entity, item.row);
    if (model === "widget")
      for (const row of await find(
        adapter,
        "host.widgets-to-external-widgets",
        { externalModule: "website-builder", externalWidgetId: id },
      ))
        keep("host.widgets-to-external-widgets", row);
    for (const [
      source,
      relation,
      sourceColumn,
      destination,
      targetColumn,
    ] of protectedEdges) {
      if (source !== model) continue;
      const relationEntity = `website-builder.${relation}`;
      for (const row of await find(adapter, relationEntity, {
        [sourceColumn]: id,
      })) {
        keep(relationEntity, row);
        queue.push({ model: destination, id: row[targetColumn] });
      }
    }
  }
  return [...records.values()].sort((a, b) =>
    `${a.entity}:${a.row.id}`.localeCompare(`${b.entity}:${b.row.id}`),
  );
}
async function assertPublicPolicy(
  adapter: IWidgetCutoverAdapter,
  path: string,
) {
  const permissions = await find(adapter, "rbac.permission", {
    method: "GET",
    path,
  });
  if (permissions.length > 1)
    throw Error(`Ambiguous public read policy ${path}`);
  if (permissions[0]) {
    if (
      permissions[0].type !== "HTTP" ||
      (
        await find(adapter, "rbac.roles-to-permissions", {
          permissionId: permissions[0].id,
        })
      ).length
    )
      throw Error(`Preserve existing role-bound/non-HTTP policy ${path}`);
  }
  return permissions[0];
}

export async function prepareBlogExamples(
  input: IBlogExampleInput,
  adapter: IWidgetCutoverAdapter,
  references?: IBlogReference[],
): Promise<IBlogExampleManifest> {
  validate(input);
  const refs = references ?? (await blogExampleReferences());
  const protectedRecords = await protectedGraph(input, adapter, refs);
  const manifest: IBlogExampleManifest = {
    schema: "sps.blog-example-content-manifest.v1",
    input: structuredClone(input),
    createdAt: new Date().toISOString(),
    references: refs,
    operations: [],
    articles: {},
    authorId: "",
    protectedFingerprint: fingerprint(protectedRecords),
    protectedRecords,
    assets: [],
    deletion: [],
    unchanged: [],
  };
  const upsert = async (
    entity: string,
    selector: Record<string, unknown>,
    data: Record<string, unknown>,
    key: string,
    requiredId?: string,
  ) => {
    const rows = await find(adapter, entity, selector);
    if (rows.length > 1) throw Error(`Ambiguous managed record ${key}`);
    const before = requiredId
      ? await exact(adapter, entity, requiredId)
      : rows[0];
    if (before && !matches(before, selector) && entity !== "blog.category")
      throw Error(`Immutable natural key differs ${key}`);
    if (requiredId && rows[0] && rows[0].id !== requiredId)
      throw Error(`Exact ID/slug differ ${key}`);
    if (before && matches(before, data)) {
      manifest.unchanged.push({ entity, row: before });
      return before.id;
    }
    const id = before?.id ?? randomUUID();
    manifest.operations.push({
      key,
      action: before ? "update" : "create",
      entity,
      id,
      selector,
      data: before ? { ...writable(before), ...data } : data,
      before,
      phase: "publish",
      state: "pending",
    });
    return id;
  };
  const remove = (
    entity: string,
    row: IRecord,
    key: string,
    phase: "publish" | "retire" = "publish",
  ) =>
    manifest.operations.push({
      key,
      action: "delete",
      entity,
      id: row.id,
      selector: { id: row.id },
      before: row,
      phase,
      state: "pending",
    });
  const assetIds = [
    ...input.articles.map((row) => row.coverFileId),
    input.author.avatarFileId,
  ];
  unique(assetIds, "public cover/avatar File IDs");
  const privateFiles = new Set(
    protectedRecords
      .filter((item) => item.entity === "file-storage.file")
      .map((item) => item.row.id),
  );
  for (const id of assetIds) {
    if (privateFiles.has(id))
      throw Error(`Public asset overlaps protected File ${id}`);
    const row = await exact(adapter, "file-storage.file", id);
    if (
      !/^\/file-storage\/[A-Za-z0-9_./-]+$/.test(row.file) ||
      row.file.split("/").includes("..")
    )
      throw Error(`Asset requires managed File bytes ${id}`);
    manifest.assets.push({ entity: "file-storage.file", row });
  }
  for (const row of input.categories) {
    const { id, ...data } = row;
    await upsert(
      "blog.category",
      { slug: row.slug },
      data,
      `category:${id}`,
      id,
    );
  }
  manifest.authorId = await upsert(
    "social.profile",
    { slug: input.author.slug },
    {
      slug: input.author.slug,
      adminTitle: input.author.title.en,
      title: input.author.title,
      ...(input.author.subtitle ? { subtitle: input.author.subtitle } : {}),
      ...(input.author.description
        ? { description: input.author.description }
        : {}),
    },
    "author",
  );
  const avatarLinks = await find(
    adapter,
    "social.profiles-to-file-storage-module-files",
    { profileId: manifest.authorId },
  );
  if (
    avatarLinks.some(
      (row) => row.fileStorageModuleFileId !== input.author.avatarFileId,
    )
  )
    throw Error("Editorial Profile has another saved avatar/media association");
  await upsert(
    "social.profiles-to-file-storage-module-files",
    {
      profileId: manifest.authorId,
      fileStorageModuleFileId: input.author.avatarFileId,
    },
    {
      profileId: manifest.authorId,
      fileStorageModuleFileId: input.author.avatarFileId,
      variant: "default",
      orderIndex: 0,
    },
    "author:avatar",
  );
  for (const article of input.articles) {
    const { key, id, categoryId, coverFileId, ...data } = article;
    const articleId = await upsert(
      "blog.article",
      { slug: article.slug },
      data,
      `article:${key}`,
      id,
    );
    manifest.articles[key] = articleId;
    await upsert(
      "blog.categories-to-articles",
      { articleId, categoryId },
      {
        articleId,
        categoryId,
        variant: "default",
        orderIndex: input.articles
          .filter((row) => row.categoryId === categoryId)
          .findIndex((row) => row.key === key),
      },
      `article:${key}:category`,
    );
    for (const previous of await find(adapter, "blog.categories-to-articles", {
      articleId,
    }))
      if (previous.categoryId !== categoryId)
        remove(
          "blog.categories-to-articles",
          previous,
          `article:${key}:old-category:${previous.id}`,
        );
    const existingFiles = await find(
      adapter,
      "blog.articles-to-file-storage-module-files",
      { articleId },
    );
    if (
      existingFiles.some((row) => row.fileStorageModuleFileId !== coverFileId)
    )
      throw Error(`Article has unmanaged cover/media associations ${key}`);
    await upsert(
      "blog.articles-to-file-storage-module-files",
      { articleId, fileStorageModuleFileId: coverFileId },
      {
        articleId,
        fileStorageModuleFileId: coverFileId,
        variant: "default",
        orderIndex: 0,
      },
      `article:${key}:cover`,
    );
    const existingAuthors = await find(
      adapter,
      "social.profiles-to-blog-module-articles",
      { blogModuleArticleId: articleId },
    );
    if (existingAuthors.some((row) => row.profileId !== manifest.authorId))
      throw Error(`Article has another saved author ${key}`);
    await upsert(
      "social.profiles-to-blog-module-articles",
      { profileId: manifest.authorId, blogModuleArticleId: articleId },
      {
        profileId: manifest.authorId,
        blogModuleArticleId: articleId,
        variant: "default",
        orderIndex: input.articles.findIndex((row) => row.key === key),
      },
      `article:${key}:author`,
    );
  }
  const retiredIds = new Set(input.deleteArticles.map((row) => row.id));
  for (const target of input.articleWidgets) {
    manifest.unchanged.push({
      entity: "blog.widget",
      row: await exact(adapter, "blog.widget", target.widgetId),
    });
    const desired = target.articleKeys.map((key) => manifest.articles[key]);
    for (const row of await find(adapter, "blog.widgets-to-articles", {
      widgetId: target.widgetId,
    }))
      if (!desired.includes(row.articleId) && !retiredIds.has(row.articleId))
        throw Error(
          `Curated Widget contains an unmanaged Article ${target.widgetId}:${row.articleId}`,
        );
    for (const [orderIndex, articleId] of desired.entries())
      await upsert(
        "blog.widgets-to-articles",
        { widgetId: target.widgetId, articleId },
        {
          widgetId: target.widgetId,
          articleId,
          variant: "default",
          orderIndex,
        },
        `widget:${target.widgetId}:article:${articleId}`,
      );
  }
  for (const target of input.categoryWidgets) {
    manifest.unchanged.push({
      entity: "blog.widget",
      row: await exact(adapter, "blog.widget", target.widgetId),
    });
    for (const row of await find(adapter, "blog.widgets-to-categories", {
      widgetId: target.widgetId,
    }))
      if (!target.categoryIds.includes(row.categoryId))
        throw Error(
          `Curated Widget contains an unmanaged Category ${target.widgetId}`,
        );
    for (const [orderIndex, categoryId] of target.categoryIds.entries())
      await upsert(
        "blog.widgets-to-categories",
        { widgetId: target.widgetId, categoryId },
        {
          widgetId: target.widgetId,
          categoryId,
          variant: "default",
          orderIndex,
        },
        `widget:${target.widgetId}:category:${categoryId}`,
      );
  }
  for (const path of input.publicReadPaths) {
    const permission = await assertPublicPolicy(adapter, path);
    if (permission)
      manifest.unchanged.push({ entity: "rbac.permission", row: permission });
    else
      await upsert(
        "rbac.permission",
        { method: "GET", path },
        { type: "HTTP", method: "GET", path, variant: "default" },
        `public:${path}`,
      );
  }
  for (const target of input.deleteArticles) {
    const rows = await find(adapter, "blog.article", { id: target.id });
    if (!rows.length) {
      if ((await find(adapter, "blog.article", { slug: target.slug })).length)
        throw Error(`Retired slug reused ${target.slug}`);
      continue;
    }
    if (rows[0].slug !== target.slug)
      throw Error(`Retirement ID/slug differs ${target.id}`);
    const cascades = await incoming(adapter, refs, "blog.article", target.id);
    if (
      cascades.some((item) =>
        [
          "blog.articles-to-file-storage-module-files",
          "blog.articles-to-website-builder-module-widgets",
        ].includes(item.entity),
      )
    )
      throw Error(
        `Retired Article owns media/WB associations; resolve explicitly before prepare: ${target.id}`,
      );
    manifest.deletion.push({ article: rows[0], cascades });
    remove("blog.article", rows[0], `retire:${target.id}`, "retire");
  }
  return manifest;
}

function remap(
  manifest: IBlogExampleManifest,
  previous: string,
  actual: string,
) {
  const walk = (value: any): any =>
    value === previous
      ? actual
      : Array.isArray(value)
        ? value.map(walk)
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value).map(([key, item]) => [key, walk(item)]),
            )
          : value;
  manifest.operations = manifest.operations.map((op) => ({
    ...op,
    id: op.id === previous ? actual : op.id,
    selector: walk(op.selector),
    data: walk(op.data),
  }));
  manifest.articles = walk(manifest.articles);
  if (manifest.authorId === previous) manifest.authorId = actual;
}
async function assertProtected(
  manifest: IBlogExampleManifest,
  adapter: IWidgetCutoverAdapter,
) {
  if (
    fingerprint(
      await protectedGraph(manifest.input, adapter, manifest.references),
    ) !== manifest.protectedFingerprint
  )
    throw Error("Protected Article subscription/Widget/File graph changed");
  for (const asset of manifest.assets)
    if (
      stable(await exact(adapter, asset.entity, asset.row.id)) !==
      stable(asset.row)
    )
      throw Error(`Public asset changed ${asset.row.id}`);
}
async function verifyPublished(
  manifest: IBlogExampleManifest,
  adapter: IWidgetCutoverAdapter,
) {
  await assertProtected(manifest, adapter);
  for (const observation of manifest.unchanged)
    if (
      stable(await exact(adapter, observation.entity, observation.row.id)) !==
      stable(observation.row)
    )
      throw Error(
        `Unchanged record changed ${observation.entity}:${observation.row.id}`,
      );
  for (const op of manifest.operations.filter(
    (row) => row.phase === "publish",
  )) {
    const rows = await find(adapter, op.entity, { id: op.id });
    if (op.action === "delete") {
      if (rows.length) throw Error(`Obsolete association remains ${op.key}`);
    } else if (
      op.state !== "done" ||
      !matches(rows[0], op.data!) ||
      stable(rows[0]) !== stable(op.result)
    )
      throw Error(`Publication readback differs ${op.key}`);
  }
  for (const path of manifest.input.publicReadPaths)
    if (!(await assertPublicPolicy(adapter, path)))
      throw Error(`Public read permission missing ${path}`);
  await verifyCuration(manifest, adapter, true);
}
async function verifyCuration(
  manifest: IBlogExampleManifest,
  adapter: IWidgetCutoverAdapter,
  allowRetiring: boolean,
) {
  const { input } = manifest;
  const retiring = new Set(
    allowRetiring ? input.deleteArticles.map((row) => row.id) : [],
  );
  const same = (actual: string[], expected: string[], label: string) => {
    if (
      stable(actual.filter((id) => !retiring.has(id)).sort()) !==
      stable([...expected].sort())
    )
      throw Error(`Curated set differs ${label}`);
  };
  for (const target of input.articleWidgets) {
    const rows = await find(adapter, "blog.widgets-to-articles", {
      widgetId: target.widgetId,
    });
    same(
      rows.map((row) => row.articleId),
      target.articleKeys.map((key) => manifest.articles[key]),
      `Article Widget ${target.widgetId}`,
    );
  }
  for (const target of input.categoryWidgets) {
    const rows = await find(adapter, "blog.widgets-to-categories", {
      widgetId: target.widgetId,
    });
    if (
      stable(rows.map((row) => row.categoryId).sort()) !==
      stable([...target.categoryIds].sort())
    )
      throw Error(`Curated Category set differs ${target.widgetId}`);
  }
  for (const target of input.categories) {
    const rows = await find(adapter, "blog.categories-to-articles", {
      categoryId: target.id,
    });
    same(
      rows.map((row) => row.articleId),
      input.articles
        .filter((row) => row.categoryId === target.id)
        .map((row) => manifest.articles[row.key]),
      `Category ${target.id}`,
    );
  }
  const avatarLinks = await find(
    adapter,
    "social.profiles-to-file-storage-module-files",
    { profileId: manifest.authorId },
  );
  if (
    avatarLinks.length !== 1 ||
    avatarLinks[0].fileStorageModuleFileId !== input.author.avatarFileId
  )
    throw Error("Editorial avatar set differs");
  for (const article of input.articles) {
    const articleId = manifest.articles[article.key];
    const authors = await find(
      adapter,
      "social.profiles-to-blog-module-articles",
      { blogModuleArticleId: articleId },
    );
    const covers = await find(
      adapter,
      "blog.articles-to-file-storage-module-files",
      { articleId },
    );
    if (
      authors.length !== 1 ||
      authors[0].profileId !== manifest.authorId ||
      covers.length !== 1 ||
      covers[0].fileStorageModuleFileId !== article.coverFileId
    )
      throw Error(`Article author/cover set differs ${article.key}`);
  }
}
async function assertRetirements(
  manifest: IBlogExampleManifest,
  adapter: IWidgetCutoverAdapter,
) {
  for (const op of manifest.operations.filter(
    (row) => row.phase === "retire" && row.state !== "done",
  )) {
    const rows = await find(adapter, op.entity, { id: op.id });
    if (!rows.length && op.state === "started") continue;
    if (stable(rows[0]) !== stable(op.before))
      throw Error(`Stale prepared retirement ${op.id}`);
    const saved = manifest.deletion.find((row) => row.article.id === op.id)!;
    if (
      stable(
        await incoming(adapter, manifest.references, "blog.article", op.id),
      ) !== stable(saved.cascades)
    )
      throw Error(`Retirement cascades changed ${op.id}`);
  }
}
export async function applyBlogExamples(
  manifest: IBlogExampleManifest,
  adapter: IWidgetCutoverAdapter,
  persist: (manifest: IBlogExampleManifest) => Promise<void>,
) {
  validate(manifest.input);
  if (manifest.schema !== "sps.blog-example-content-manifest.v1")
    throw Error("Wrong publication manifest");
  await assertProtected(manifest, adapter);
  for (const path of manifest.input.publicReadPaths)
    await assertPublicPolicy(adapter, path);
  let writes = 0;
  for (const phase of ["publish", "retire"] as const) {
    if (phase === "retire") {
      await verifyPublished(manifest, adapter);
      await assertRetirements(manifest, adapter);
    }
    for (let index = 0; index < manifest.operations.length; index++) {
      let op = manifest.operations[index];
      if (op.phase !== phase) continue;
      const sdk = await adapter(op.entity);
      const rows = await find(
        adapter,
        op.entity,
        op.action === "create" ? op.selector : { id: op.id },
      );
      if (rows.length > 1) throw Error(`Ambiguous recovery ${op.key}`);
      const current = rows[0];
      if (op.state === "done") {
        if (
          op.action === "delete"
            ? Boolean(current)
            : stable(current) !== stable(op.result)
        )
          throw Error(`Completed operation changed ${op.key}`);
        continue;
      }
      if (op.action === "create" && current) {
        if (op.state !== "started" || !matches(current, op.data!))
          throw Error(`Unexpected create selector ${op.key}`);
        const previous = op.id;
        op.result = current;
        op.state = "done";
        remap(manifest, previous, current.id);
        await persist(manifest);
        continue;
      }
      if (
        op.action === "update" &&
        op.state === "started" &&
        matches(current, op.data!)
      ) {
        op.result = current;
        op.state = "done";
        await persist(manifest);
        continue;
      }
      if (op.action === "delete" && !current && op.state === "started") {
        op.state = "done";
        await persist(manifest);
        continue;
      }
      if (op.action !== "create" && stable(current) !== stable(op.before))
        throw Error(`Stale prepared record ${op.key}`);
      if (op.action === "delete" && op.entity === "blog.article") {
        const saved = manifest.deletion.find(
          (row) => row.article.id === op.id,
        )!;
        if (
          stable(
            await incoming(adapter, manifest.references, "blog.article", op.id),
          ) !== stable(saved.cascades)
        )
          throw Error(`Retirement cascades changed ${op.id}`);
      }
      op.state = "started";
      await persist(manifest);
      if (op.action === "delete") {
        await sdk.delete({ id: op.id });
        if ((await find(adapter, op.entity, { id: op.id })).length)
          throw Error(`Deletion readback failed ${op.key}`);
        op.state = "done";
      } else {
        const result =
          op.action === "create"
            ? await sdk.create({ data: op.data! })
            : await sdk.update({ id: op.id, data: op.data! });
        if (!result?.id || !matches(result as IRecord, op.data!))
          throw Error(`Mutation result differs ${op.key}`);
        const row = await exact(adapter, op.entity, result.id);
        if (!matches(row, op.data!))
          throw Error(`Mutation readback differs ${op.key}`);
        op.result = row;
        op.state = "done";
        if (op.action === "create") remap(manifest, op.id, row.id);
      }
      writes++;
      await persist(manifest);
    }
  }
  await verifyBlogExamples(manifest, adapter);
  return {
    writes,
    articles: manifest.articles,
    authorId: manifest.authorId,
    retired: manifest.input.deleteArticles.length,
  };
}
export async function verifyBlogExamples(
  manifest: IBlogExampleManifest,
  adapter: IWidgetCutoverAdapter,
) {
  await verifyPublished(manifest, adapter);
  const { input } = manifest;
  for (const target of input.deleteArticles) {
    if (
      (await find(adapter, "blog.article", { id: target.id })).length ||
      (await find(adapter, "blog.article", { slug: target.slug })).length
    )
      throw Error(`Retired Article remains ${target.id}`);
    for (const ref of manifest.references.filter(
      (row) => row.target === "blog.article",
    ))
      if ((await find(adapter, ref.entity, { [ref.column]: target.id })).length)
        throw Error(
          `Retired Article relation remains ${ref.entity}:${target.id}`,
        );
  }
  await verifyCuration(manifest, adapter, false);
  return {
    articles: input.articles.length,
    categories: input.categories.length,
    retired: input.deleteArticles.length,
    protectedGraph: "unchanged",
  };
}

export async function blogExampleCli(argv = process.argv.slice(2)) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { "exclusive-maintenance": { type: "boolean", default: false } },
  });
  const [mode, inputPath, manifestPath] = positionals;
  if (
    !["prepare", "apply", "verify"].includes(mode) ||
    !inputPath ||
    positionals.length !== (mode === "prepare" ? 3 : 2)
  )
    throw Error(
      "Usage: blog-example-content.ts prepare <input.json> <new-before-manifest.json> | apply|verify <manifest.json>",
    );
  if (mode === "apply" && !values["exclusive-maintenance"])
    throw Error(
      "Apply requires --exclusive-maintenance with other CMS writers stopped",
    );
  if (!process.env.RBAC_SECRET_KEY)
    throw Error("Operator SDK credentials are required");
  const origin = new URL(API_SERVICE_URL ?? "");
  if (
    !["http://localhost:4000", "http://127.0.0.1:4000"].includes(
      origin.origin,
    ) ||
    origin.href !== `${origin.origin}/`
  )
    throw Error(
      "This command requires an explicit credential-free localhost:4000 API_SERVICE_URL",
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
  const lock = await open(`${destination}.lock`, "wx", 0o600);
  const persist = async (manifest: IBlogExampleManifest) => {
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
      const manifest = await prepareBlogExamples(
        JSON.parse(await readFile(inputPath, "utf8")),
        adapter,
      );
      manifest.apiOrigin = origin.origin;
      await persist(manifest);
      console.log({
        operations: manifest.operations.length,
        retirements: manifest.deletion.map((row) => ({
          id: row.article.id,
          slug: row.article.slug,
          cascades: row.cascades.map((item) => ({
            entity: item.entity,
            id: item.row.id,
          })),
        })),
        protectedGraph: manifest.protectedFingerprint,
      });
    } else {
      const manifest: IBlogExampleManifest = JSON.parse(
        await readFile(destination, "utf8"),
      );
      if (
        manifest.schema !== "sps.blog-example-content-manifest.v1" ||
        manifest.apiOrigin !== origin.origin
      )
        throw Error("Manifest does not belong to this publication/API");
      console.log(
        mode === "apply"
          ? await applyBlogExamples(manifest, adapter, persist)
          : await verifyBlogExamples(manifest, adapter),
      );
      for (const path of manifest.input.publicReadPaths) {
        const response = await fetch(origin.origin + path, {
          cache: "no-store",
        });
        if (!response.ok)
          throw Error(
            `Anonymous author metadata read failed ${path}: ${response.status}`,
          );
      }
    }
  } finally {
    await lock.close();
    await unlink(`${destination}.lock`);
  }
}
if (import.meta.main)
  blogExampleCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
