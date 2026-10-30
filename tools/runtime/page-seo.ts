import { createHash } from "node:crypto";
import { open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { API_SERVICE_URL } from "@sps/shared-utils";
import { cutoverApiOrigin } from "./ai-chat-widget-links";

interface IRecord {
  id: string;
  [field: string]: unknown;
}
interface IFields {
  [field: string]: unknown;
}
interface IAsset {
  path: string;
  sha256: string;
  alt: string;
  label?: string;
}
interface IPageDefinition {
  url: string;
  language: string;
  cover: string;
  page?: { title: string; description: string };
  metadata: IFields & { title: string; description: string };
}
export interface IPageSeoInput {
  schema: "sps.page-seo-input.v1";
  assets: Record<string, IAsset>;
  pages: IPageDefinition[];
}
interface ISdk {
  find: (props?: { params?: IFields }) => Promise<IRecord[] | undefined>;
  create: (props: { data: IFields }) => Promise<IRecord | undefined>;
  update: (props: {
    id: string;
    data: IFields;
  }) => Promise<IRecord | undefined>;
  delete: (props: { id: string }) => Promise<unknown>;
}
export interface IPageSeoAdapter {
  pages: ISdk;
  metadata: ISdk;
  pageLinks: ISdk;
  coverLinks: ISdk;
  files: ISdk;
}
interface ICreateState {
  data: IFields;
  beforeIds?: string[];
  id?: string;
}
interface IPageOperation {
  before: IRecord;
  definition: IPageDefinition;
  metadata: ICreateState;
  coverLink?: ICreateState;
  pageLink?: ICreateState;
}
export interface IPageSeoManifest {
  schema: "sps.page-seo-manifest.v1";
  apiOrigin?: string;
  input: IPageSeoInput;
  createdAt: string;
  before: {
    metadata: IRecord[];
    pageLinks: IRecord[];
    coverLinks: IRecord[];
  };
  assets: Record<string, { fileId?: string }>;
  operations: IPageOperation[];
  rolledBack?: boolean;
}
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
};
const matches = (row: IRecord, fields: IFields) =>
  Object.entries(fields).every(
    ([key, value]) => stable(row[key]) === stable(value),
  );
const visible = (row: IRecord) => row.variant !== "hidden";
const ordered = (rows: IRecord[]) =>
  rows
    .filter(visible)
    .sort(
      (a, b) =>
        Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0) ||
        a.id.localeCompare(b.id),
    );
async function all(api: ISdk): Promise<IRecord[]> {
  const result: IRecord[] = [];
  for (let offset = 0; ; offset += 100) {
    const rows = await api.find({
      params: {
        includeHidden: 1,
        limit: 100,
        offset,
        orderBy: { and: [{ column: "id", method: "asc" }] },
      },
    });
    if (
      !rows ||
      rows.some((row) => result.some((prior) => prior.id === row.id))
    )
      throw Error("Unreadable or unstable SEO inventory");
    result.push(...rows);
    if (rows.length < 100) return result;
  }
}
export async function preparePageSeo(
  input: IPageSeoInput,
  api: IPageSeoAdapter,
): Promise<IPageSeoManifest> {
  if (
    input.schema !== "sps.page-seo-input.v1" ||
    !input.pages.length ||
    !Object.keys(input.assets).length
  )
    throw Error("Explicit Page SEO input is required");
  const definitions = new Map(
    input.pages.map((page) => [`${page.language}:${page.url}`, page]),
  );
  if (
    definitions.size !== input.pages.length ||
    input.pages.some(
      (page) =>
        !page.url.startsWith("/") ||
        (page.page &&
          (!page.page.title.trim() || !page.page.description.trim())) ||
        !page.metadata.title.trim() ||
        !page.metadata.description.trim() ||
        !input.assets[page.cover],
    )
  )
    throw Error("Duplicate or incomplete Page SEO definition");
  const [pages, metadata, links, coverLinks] = await Promise.all([
    all(api.pages),
    all(api.metadata),
    all(api.pageLinks),
    all(api.coverLinks),
  ]);
  const identities = pages.map((page) => `${page.language}:${page.url}`);
  if (
    new Set(identities).size !== pages.length ||
    identities.some((key) => !definitions.has(key))
  )
    throw Error("Every saved Page needs one explicit localized SEO definition");
  const operations = pages.map((before) => {
    const definition = definitions.get(`${before.language}:${before.url}`)!;
    const current = ordered(links.filter((link) => link.pageId === before.id))
      .map((link) =>
        metadata.find((meta) => meta.id === link.metadataId && visible(meta)),
      )
      .find(Boolean);
    const { id, createdAt, updatedAt, ...priorFields } = current ?? {};
    const data = { ...priorFields, ...definition.metadata, variant: "default" };
    return {
      before,
      definition,
      metadata: {
        data,
        ...(current &&
        matches(current, data) &&
        links
          .filter((link) => link.metadataId === current.id && visible(link))
          .every((link) => link.pageId === before.id)
          ? { id: current.id }
          : {}),
      },
    };
  });
  return {
    schema: "sps.page-seo-manifest.v1",
    input,
    createdAt: new Date().toISOString(),
    before: { metadata, pageLinks: links, coverLinks },
    assets: Object.fromEntries(
      [
        ...new Set(operations.map((operation) => operation.definition.cover)),
      ].map((key) => [key, {}]),
    ),
    operations,
  };
}
async function create(
  api: ISdk,
  state: ICreateState,
  persist: () => Promise<void>,
) {
  const rows = await all(api);
  if (state.id) {
    const current = rows.find((row) => row.id === state.id);
    if (!current || !matches(current, state.data))
      throw Error("SEO record changed after preparation");
    return current;
  }
  if (state.beforeIds) {
    const recovered = rows.filter(
      (row) => !state.beforeIds!.includes(row.id) && matches(row, state.data),
    );
    if (recovered.length !== 1)
      throw Error(
        "Unknown create outcome: inspect the pending SEO operation before retrying",
      );
    state.id = recovered[0].id;
    await persist();
    return recovered[0];
  }
  state.beforeIds = rows.map((row) => row.id);
  await persist();
  const record = await api.create({ data: { ...state.data } });
  if (!record || !matches(record, state.data))
    throw Error("SEO create readback failed");
  state.id = record.id;
  await persist();
  return record;
}
async function ensureLink(api: ISdk, data: IFields, existing?: ICreateState) {
  const rows = await all(api);
  const candidates = rows.filter((row) => matches(row, data));
  if (candidates.length > 1) throw Error("Ambiguous SEO relation");
  const state = existing ?? {
    data,
    ...(candidates[0] ? { id: candidates[0].id } : {}),
  };
  if (!matches({ id: "expected", ...state.data }, data))
    throw Error("Pending SEO relation changed");
  return state;
}
export async function applyPageSeo(
  manifest: IPageSeoManifest,
  api: IPageSeoAdapter,
  persist: () => Promise<void>,
  readAsset: (path: string) => Promise<Uint8Array>,
) {
  if (manifest.rolledBack) throw Error("Prepare a new manifest after rollback");
  const bytes = new Map<string, Uint8Array>();
  for (const [key, asset] of Object.keys(manifest.assets).map(
    (key) => [key, manifest.input.assets[key]] as const,
  )) {
    const value = await readAsset(asset.path);
    if (createHash("sha256").update(value).digest("hex") !== asset.sha256)
      throw Error(`Cover bytes changed: ${key}`);
    bytes.set(key, value);
  }
  const currentPages = await all(api.pages);
  for (const operation of manifest.operations) {
    const current = currentPages.find(
      (page) => page.id === operation.before.id,
    );
    if (
      !current ||
      !matches(
        current,
        Object.fromEntries(
          Object.entries(operation.before).filter(
            ([key]) => !["title", "description", "updatedAt"].includes(key),
          ),
        ),
      ) ||
      (!matches(current, operation.definition.page ?? {}) &&
        !matches(current, {
          title: operation.before.title,
          description: operation.before.description,
        }))
    )
      throw Error("Page changed after SEO preparation");
  }
  for (const [key, asset] of Object.keys(manifest.assets).map(
    (key) => [key, manifest.input.assets[key]] as const,
  )) {
    const slug = `page-seo-${key}-${asset.sha256.slice(0, 16)}`;
    const rows = (await all(api.files)).filter((file) => file.slug === slug);
    if (rows.length > 1) throw Error("Ambiguous SEO cover slug");
    const file =
      rows[0] ??
      (await api.files.create({
        data: {
          slug,
          adminTitle: asset.label ?? `Page SEO · ${key}`,
          alt: asset.alt,
          variant: "default",
          file: new File([bytes.get(key)! as BlobPart], `${key}.webp`, {
            type: "image/webp",
          }),
        },
      }));
    if (
      !file ||
      !visible(file) ||
      file.mimeType !== "image/webp" ||
      Number(file.width) < 600 ||
      Number(file.height) < 600 ||
      file.alt !== asset.alt
    )
      throw Error("Invalid SEO cover upload");
    manifest.assets[key].fileId = file.id;
    await persist();
  }
  for (const operation of manifest.operations) {
    const meta = await create(api.metadata, operation.metadata, persist);
    const covers = (await all(api.coverLinks)).filter(
      (link) => link.metadataId === meta.id,
    );
    const fileId = manifest.assets[operation.definition.cover].fileId;
    const selectedCover = ordered(covers)[0];
    operation.coverLink = await ensureLink(
      api.coverLinks,
      {
        metadataId: meta.id,
        fileStorageModuleFileId: fileId,
        variant: "default",
        orderIndex:
          selectedCover?.fileStorageModuleFileId === fileId
            ? Number(selectedCover.orderIndex)
            : Math.min(
                0,
                ...covers.map((link) => Number(link.orderIndex ?? 0)),
              ) - 1,
      },
      operation.coverLink,
    );
    await persist();
    await create(api.coverLinks, operation.coverLink, persist);
    const current = (await all(api.pages)).find(
      (page) => page.id === operation.before.id,
    )!;
    if (!matches(current, operation.definition.page ?? {})) {
      if (
        !matches(current, {
          title: operation.before.title,
          description: operation.before.description,
        })
      )
        throw Error("Page SEO text changed during publication");
      const result = await api.pages.update({
        id: current.id,
        data: operation.definition.page,
      });
      if (!result || !matches(result, operation.definition.page))
        throw Error("Page SEO text readback failed");
    }
    if (!operation.pageLink) {
      const links = (await all(api.pageLinks)).filter(
        (link) => link.pageId === current.id,
      );
      const selected = ordered(links)[0];
      const data = {
        pageId: current.id,
        metadataId: meta.id,
        variant: "default",
        orderIndex:
          selected?.metadataId === meta.id
            ? Number(selected.orderIndex)
            : Math.min(
                0,
                ...links.map((link) => Number(link.orderIndex ?? 0)),
              ) - 1,
      };
      operation.pageLink = await ensureLink(api.pageLinks, data);
      await persist();
    }
    await create(api.pageLinks, operation.pageLink, persist);
  }
  return verifyPageSeo(manifest, api);
}
export async function verifyPageSeo(
  manifest: IPageSeoManifest,
  api: IPageSeoAdapter,
) {
  const [pages, metadata, links, covers, files] = await Promise.all([
    all(api.pages),
    all(api.metadata),
    all(api.pageLinks),
    all(api.coverLinks),
    all(api.files),
  ]);
  for (const operation of manifest.operations) {
    const page = pages.find((page) => page.id === operation.before.id);
    const selected = ordered(
      links.filter((link) => link.pageId === page?.id),
    ).find((link) =>
      metadata.some((meta) => meta.id === link.metadataId && visible(meta)),
    );
    const meta = metadata.find((meta) => meta.id === selected?.metadataId);
    const cover = files.find(
      (file) =>
        file.id === manifest.assets[operation.definition.cover].fileId &&
        visible(file),
    );
    if (
      !page ||
      !matches(page, operation.definition.page ?? {}) ||
      !meta ||
      meta.id !== operation.metadata.id ||
      !matches(meta, operation.metadata.data) ||
      !cover ||
      ordered(
        covers.filter(
          (link) =>
            link.metadataId === meta.id &&
            files.some(
              (file) =>
                file.id === link.fileStorageModuleFileId && visible(file),
            ),
        ),
      )[0]?.fileStorageModuleFileId !== cover.id
    )
      throw Error(
        `Page SEO verification failed: ${operation.definition.language}:${operation.definition.url}`,
      );
  }
  return {
    pages: manifest.operations.length,
    metadata: manifest.operations.length,
    covers: Object.keys(manifest.assets).length,
  };
}
export async function rollbackPageSeo(
  manifest: IPageSeoManifest,
  api: IPageSeoAdapter,
  persist: () => Promise<void>,
) {
  for (const operation of [...manifest.operations].reverse()) {
    if (operation.pageLink?.id && operation.pageLink.beforeIds) {
      const row = (await all(api.pageLinks)).find(
        (row) => row.id === operation.pageLink?.id,
      );
      if (row && !matches(row, operation.pageLink.data))
        throw Error("Published SEO relation was edited; refusing rollback");
      if (row) await api.pageLinks.delete({ id: row.id });
    }
    if (!operation.definition.page) continue;
    const current = (await all(api.pages)).find(
      (row) => row.id === operation.before.id,
    );
    if (
      !current ||
      (!matches(current, operation.definition.page ?? {}) &&
        !matches(current, {
          title: operation.before.title,
          description: operation.before.description,
        }))
    )
      throw Error("Page SEO fields were edited; refusing rollback");
    await api.pages.update({
      id: current.id,
      data: {
        title: operation.before.title,
        description: operation.before.description,
      },
    });
  }
  manifest.rolledBack = true;
  await persist();
}
async function cli(argv = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { "allow-api-origin": { type: "string" } },
  });
  const [mode, inputPath, destination] = positionals;
  if (
    !["prepare", "apply", "verify", "rollback"].includes(mode) ||
    !inputPath ||
    (mode === "prepare" && !destination)
  )
    throw Error(
      "Usage: page-seo.ts prepare <input.json> <new-manifest.json> | apply|verify|rollback <manifest.json> [--allow-api-origin https://api.example.com]",
    );
  if (!process.env.RBAC_SECRET_KEY)
    throw Error("Operator SDK credential required");
  const origin = cutoverApiOrigin(
    API_SERVICE_URL ?? "",
    values["allow-api-origin"],
  );
  const options = {
    cache: "no-store" as const,
    headers: {
      "X-RBAC-SECRET-KEY": process.env.RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    },
  };
  const modules = await Promise.all([
    import("@sps/host/models/page/sdk/server"),
    import("@sps/host/models/metadata/sdk/server"),
    import("@sps/host/relations/pages-to-metadata/sdk/server"),
    import(
      "@sps/host/relations/metadata-to-file-storage-module-files/sdk/server"
    ),
    import("@sps/file-storage/models/file/sdk/server"),
  ]);
  const keys = [
    "pages",
    "metadata",
    "pageLinks",
    "coverLinks",
    "files",
  ] as const;
  const api = Object.fromEntries(
    modules.map((module, index) => [
      keys[index],
      Object.fromEntries(
        ["find", "create", "update", "delete"].map((method) => [
          method,
          (props: IFields) =>
            (
              module.api as unknown as Record<
                string,
                (props: IFields) => Promise<unknown>
              >
            )[method]({ ...props, options }),
        ]),
      ),
    ]),
  ) as unknown as IPageSeoAdapter;
  const path = resolve(mode === "prepare" ? destination : inputPath);
  const lock = await open(`${path}.lock`, "wx", 0o600);
  const persist = async () => {
    const temporary = `${path}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(manifest, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(temporary, path);
  };
  let manifest: IPageSeoManifest;
  try {
    if (mode === "prepare") {
      try {
        await readFile(path);
        throw Error("Before manifest already exists");
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
      const input = JSON.parse(
        await readFile(resolve(inputPath), "utf8"),
      ) as IPageSeoInput;
      input.assets = Object.fromEntries(
        Object.entries(input.assets).map(([key, value]) => [
          key,
          { ...value, path: resolve(dirname(resolve(inputPath)), value.path) },
        ]),
      );
      for (const asset of Object.values(input.assets))
        if (
          createHash("sha256")
            .update(await readFile(asset.path))
            .digest("hex") !== asset.sha256
        )
          throw Error("Cover digest mismatch");
      manifest = await preparePageSeo(input, api);
      manifest.apiOrigin = origin.origin;
      await persist();
      console.log(
        JSON.stringify({
          mode,
          pages: manifest.operations.length,
          covers: Object.keys(manifest.assets).length,
        }),
      );
    } else {
      manifest = JSON.parse(await readFile(path, "utf8"));
      if (
        manifest.schema !== "sps.page-seo-manifest.v1" ||
        manifest.apiOrigin !== origin.origin
      )
        throw Error("Manifest origin/schema mismatch");
      const result =
        mode === "apply"
          ? await applyPageSeo(manifest, api, persist, readFile)
          : mode === "verify"
            ? await verifyPageSeo(manifest, api)
            : await rollbackPageSeo(manifest, api, persist);
      console.log(JSON.stringify({ mode, result }));
    }
  } finally {
    await lock.close();
    await unlink(`${path}.lock`);
  }
}
if (import.meta.main)
  cli().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
