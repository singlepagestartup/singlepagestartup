import { readFile, writeFile, rename } from "node:fs/promises";

interface IRecord {
  id: string;
  [key: string]: any;
}
interface ISdk {
  find: (props?: any) => Promise<IRecord[]>;
  update: (props: { id: string; data: any }) => Promise<any>;
  delete: (props: { id: string }) => Promise<any>;
}
export interface IPageLanguageApi {
  pages: ISdk;
  metadata: ISdk;
  links: ISdk;
  widgets: ISdk;
  layouts: ISdk;
}
export type IPageLanguageSnapshot = Record<keyof IPageLanguageApi, IRecord[]>;
export interface IPageLanguagePlan {
  schema: "sps.page-languages.v1";
  before: IPageLanguageSnapshot;
  operations: {
    pageId: string;
    metadataId: string;
    pageMetadata: Record<string, any>;
    metadataFields: Record<string, string>;
    duplicateIds: string[];
    complete?: boolean;
  }[];
}
const ordered = (rows: IRecord[]) =>
  [...rows].sort(
    (a, b) =>
      Number(a.orderIndex || 0) - Number(b.orderIndex || 0) ||
      a.id.localeCompare(b.id),
  );
const stable = (value: any): string =>
  JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );
const same = (a: any, b: any) => stable(a) === stable(b);
const association = (rows: IRecord[], pageId: string) =>
  rows
    .filter((row) => row.pageId === pageId)
    .map(({ id, pageId, createdAt, updatedAt, ...fields }) => stable(fields))
    .sort();

/** Consolidates only equivalent route compositions; translations remain ordinary mask inputs. */
export function preparePageLanguages(
  before: IPageLanguageSnapshot,
): IPageLanguagePlan {
  const groups = new Map<string, IRecord[]>();
  for (const page of before.pages)
    groups.set(page.url, [...(groups.get(page.url) || []), page]);
  const operations: IPageLanguagePlan["operations"] = [];
  for (const [url, pages] of groups) {
    if (pages.length === 1) continue;
    pages.sort(
      (a, b) =>
        String(a.createdAt).localeCompare(String(b.createdAt)) ||
        a.id.localeCompare(b.id),
    );
    const canonical = pages[0];
    if (
      new Set(pages.map((page) => page.language)).size !== pages.length ||
      pages.some(
        (page) =>
          !page.language ||
          page.variant !== canonical.variant ||
          page.className !== canonical.className ||
          !same(
            association(before.widgets, page.id),
            association(before.widgets, canonical.id),
          ) ||
          !same(
            association(before.layouts, page.id),
            association(before.layouts, canonical.id),
          ),
      )
    )
      throw Error(`Conflicting Page composition: ${url}`);
    const selected = pages.map((page) => {
      const link = ordered(
        before.links.filter((row) => row.pageId === page.id),
      )[0];
      const metadata = before.metadata.find(
        (row) => row.id === link?.metadataId,
      );
      if (!metadata) throw Error(`Missing linked Metadata: ${url}`);
      return { page, metadata };
    });
    const metadata = selected[0].metadata;
    if (
      before.links.some(
        (link) =>
          link.metadataId === metadata.id &&
          !pages.some((page) => page.id === link.pageId),
      )
    )
      throw Error(
        `Shared Metadata must be forked before consolidation: ${url}`,
      );
    const pageMetadata = structuredClone(canonical.metadata || {});
    const metadataFields: Record<string, string> = {};
    for (const field of Object.keys(metadata)) {
      if (["id", "createdAt", "updatedAt", "variant"].includes(field)) continue;
      const values = selected.map((row) => row.metadata[field]);
      if (values.every((value) => same(value, values[0]))) continue;
      if (
        values.some((value) => value != null && typeof value !== "string") ||
        values.some((value) => /[\[\]]/.test(value || ""))
      )
        throw Error(`Conflicting Metadata masks: ${url} ${field}`);
      const section = ["title", "description", "keywords"].includes(field)
        ? "seo"
        : "seoDisplay";
      pageMetadata[section] ||= {};
      pageMetadata[section][field] = Object.fromEntries(
        selected.map(({ page, metadata }) => [
          page.language,
          field === "keywords"
            ? String(metadata[field] || "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : metadata[field] || "",
        ]),
      );
      metadataFields[field] = `[host.pages.metadata.${section}.${field}]`;
    }
    operations.push({
      pageId: canonical.id,
      metadataId: metadata.id,
      pageMetadata,
      metadataFields,
      duplicateIds: pages.slice(1).map((page) => page.id),
    });
  }
  return { schema: "sps.page-languages.v1", before, operations };
}

/** Persisted progress and before-images allow a stopped migration to resume safely. */
export async function applyPageLanguages(
  plan: IPageLanguagePlan,
  api: IPageLanguageApi,
  persist: () => Promise<void>,
) {
  if (plan.schema !== "sps.page-languages.v1")
    throw Error("Unknown Page language migration");
  for (const operation of plan.operations) {
    if (operation.complete) continue;
    const currentPages = await api.pages.find();
    const original = plan.before.pages.find(
      (row) => row.id === operation.pageId,
    )!;
    const page = currentPages.find((row) => row.id === operation.pageId);
    for (const id of [operation.pageId, ...operation.duplicateIds]) {
      const current = currentPages.find((row) => row.id === id);
      const prior = plan.before.pages.find((row) => row.id === id)!;
      if (!current && id !== operation.pageId) continue;
      if (
        !current ||
        Object.keys(prior).some(
          (field) =>
            field !== "updatedAt" &&
            !same(current[field], prior[field]) &&
            !(
              id === operation.pageId &&
              field === "metadata" &&
              same(current[field], operation.pageMetadata)
            ),
        )
      )
        throw Error("Page changed after preparation");
    }
    const currentMetadata = await api.metadata.find();
    const groupMetadataIds = new Set(
      plan.before.links
        .filter((row) =>
          [operation.pageId, ...operation.duplicateIds].includes(row.pageId),
        )
        .map((row) => row.metadataId),
    );
    for (const id of groupMetadataIds) {
      const prior = plan.before.metadata.find((row) => row.id === id)!;
      const current = currentMetadata.find((row) => row.id === id);
      if (
        !prior ||
        !current ||
        Object.keys(prior).some(
          (field) =>
            field !== "updatedAt" &&
            !same(current[field], prior[field]) &&
            !(
              id === operation.metadataId &&
              Object.hasOwn(operation.metadataFields, field) &&
              same(current[field], operation.metadataFields[field])
            ),
        )
      )
        throw Error("Metadata changed after preparation");
    }
    for (const key of ["links", "widgets", "layouts"] as const) {
      const current = await api[key].find();
      for (const id of [operation.pageId, ...operation.duplicateIds]) {
        const planned = plan.before[key].filter((row) => row.pageId === id);
        if (
          current.some(
            (row) =>
              row.pageId === id && !planned.some((prior) => same(row, prior)),
          )
        )
          throw Error("Page associations changed after preparation");
      }
    }
    await api.pages.update({
      id: operation.pageId,
      data: {
        metadata: operation.pageMetadata,
        _expectedMetadata: page.metadata || {},
      },
    });
    if (Object.keys(operation.metadataFields).length)
      await api.metadata.update({
        id: operation.metadataId,
        data: operation.metadataFields,
      });
    for (const duplicateId of operation.duplicateIds) {
      for (const key of ["links", "widgets", "layouts"] as const) {
        const current = await api[key].find();
        const planned = plan.before[key].filter(
          (row) => row.pageId === duplicateId,
        );
        if (
          current.some(
            (row) =>
              row.pageId === duplicateId &&
              !planned.some((prior) => same(row, prior)),
          )
        )
          throw Error("Page associations changed after preparation");
        for (const link of planned)
          if (current.some((row) => row.id === link.id))
            await api[key].delete({ id: link.id });
      }
      if ((await api.pages.find()).some((row) => row.id === duplicateId))
        await api.pages.delete({ id: duplicateId });
    }
    operation.complete = true;
    await persist();
  }
}

if (import.meta.main) {
  const { api: pages } = await import("@sps/host/models/page/sdk/server");
  const { api: metadata } = await import(
    "@sps/host/models/metadata/sdk/server"
  );
  const { api: links } = await import(
    "@sps/host/relations/pages-to-metadata/sdk/server"
  );
  const { api: widgets } = await import(
    "@sps/host/relations/pages-to-widgets/sdk/server"
  );
  const { api: layouts } = await import(
    "@sps/host/relations/pages-to-layouts/sdk/server"
  );
  const { RBAC_SECRET_KEY, API_SERVICE_URL } = await import(
    "@sps/shared-utils"
  );
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(API_SERVICE_URL).hostname,
    )
  )
    throw Error(
      "Run Page consolidation against a loopback API on the target host",
    );
  const options = {
    cache: "no-store" as const,
    headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
  };
  const api = Object.fromEntries(
    Object.entries({ pages, metadata, links, widgets, layouts }).map(
      ([key, sdk]) => [
        key,
        {
          find: async () => {
            const all = [];
            for (let offset = 0; ; offset += 100) {
              const rows = await sdk.find({
                options,
                params: {
                  offset,
                  limit: 100,
                  orderBy: { and: [{ column: "id", method: "asc" }] },
                },
              });
              if (!rows) throw Error("Unreadable Page inventory");
              all.push(...rows);
              if (rows.length < 100) return all;
            }
          },
          update: ({ id, data }: any) => sdk.update({ id, data, options }),
          delete: ({ id }: any) => sdk.delete({ id, options }),
        },
      ],
    ),
  ) as unknown as IPageLanguageApi;
  const [command, file] = process.argv.slice(2);
  if (!file || !["prepare", "apply"].includes(command))
    throw Error("Usage: page-languages.ts prepare|apply <manifest.json>");
  const save = async (plan: IPageLanguagePlan) => {
    await writeFile(file + ".tmp", JSON.stringify(plan, null, 2), {
      mode: 0o600,
    });
    await rename(file + ".tmp", file);
  };
  if (command === "prepare") {
    const before = Object.fromEntries(
      await Promise.all(
        Object.entries(api).map(async ([key, sdk]) => [key, await sdk.find()]),
      ),
    ) as IPageLanguageSnapshot;
    const plan = preparePageLanguages(before);
    await writeFile(file, JSON.stringify(plan, null, 2), {
      mode: 0o600,
      flag: "wx",
    });
    console.log(
      `Prepared ${plan.operations.length} URL groups; before-images saved`,
    );
  } else {
    const plan = JSON.parse(await readFile(file, "utf8"));
    await applyPageLanguages(plan, api, () => save(plan));
    console.log(
      "Page consolidation complete; apply URL uniqueness migration next",
    );
  }
}
