import { isDeepStrictEqual } from "node:util";
import { API_SERVICE_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import {
  getContentEntityDescriptor,
  listContentEntityDescriptors,
} from "../../apps/mcp/lib/content-management/registry";
import type { IContentEntityDescriptor } from "../../apps/mcp/lib/content-management/types";
import { cutoverApiOrigin } from "./ai-chat-widget-links";
import cutover from "./framework-home-cutover.json";

interface ITarget {
  entity: string;
  id: string;
}

type IFields = Record<string, unknown>;
interface IUpdate extends ITarget {
  data: IFields;
}
interface IReference {
  entity: string;
  column: string;
  filters: IFields;
}

const key = (target: ITarget) => `${target.entity}:${target.id}`;
const camelCase = (value: string) =>
  value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

function referenceColumns(
  target: ITarget,
  descriptors: IContentEntityDescriptor[],
): IReference[] {
  const [module, model] = target.entity.split(".");
  const modelName = camelCase(model);
  const prefixedColumn = `${camelCase(module)}Module${modelName[0].toUpperCase()}${modelName.slice(1)}Id`;
  return descriptors.flatMap((descriptor) =>
    descriptor.relationFields.flatMap(({ name }) => {
      if (
        name === prefixedColumn ||
        (descriptor.module === module && name === `${modelName}Id`)
      )
        return [
          {
            entity: descriptor.key,
            column: name,
            filters: { [name]: target.id },
          },
        ];
      if (
        model === "widget" &&
        name === "externalWidgetId" &&
        descriptor.externalModules?.includes(module)
      )
        return [
          {
            entity: descriptor.key,
            column: name,
            filters: { [name]: target.id, externalModule: module },
          },
        ];
      return [];
    }),
  );
}

export async function assertRetiredContentUnreferenced(
  target: ITarget,
  descriptors: IContentEntityDescriptor[],
  find: (reference: IReference) => Promise<ITarget[]>,
  plannedDeletes = new Set<string>(),
  plannedUpdates = new Map<string, IUpdate>(),
) {
  for (const reference of referenceColumns(target, descriptors)) {
    const rows = await find(reference);
    for (const row of rows) {
      if (plannedDeletes.has(key(row))) continue;
      const update = plannedUpdates.get(key(row));
      if (
        update &&
        Object.entries(reference.filters).some(
          ([column, value]) =>
            Object.hasOwn(update.data, column) && update.data[column] !== value,
        )
      )
        continue;
      throw new Error(
        `Cannot retire ${key(target)} while ${key(row)} references it`,
      );
    }
  }
}

const matches = (row: IFields, fields: IFields) =>
  Object.entries(fields).every(([key, value]) =>
    isDeepStrictEqual(row[key], value),
  );

async function resolveSdk(entity: string) {
  const descriptor = await getContentEntityDescriptor(entity);
  if (!descriptor) throw new Error(`Missing SDK for ${entity}`);
  const options = {
    cache: "no-store" as const,
    headers: {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY!,
      "Cache-Control": "no-store",
      "X-SPS-Consistency": "1",
    },
  };
  return { ...descriptor, sdk: descriptor.api, options };
}

async function findReferences({ entity, filters }: IReference) {
  const { sdk, options } = await resolveSdk(entity);
  const and = Object.entries(filters).map(([column, value]) => ({
    column,
    value,
    method: "eq",
  }));
  const result: ITarget[] = [];
  for (let offset = 0; ; offset += 100) {
    const rows = await sdk.find({
      params: {
        filters: { and },
        orderBy: { and: [{ column: "id", method: "asc" }] },
        limit: 100,
        offset,
      },
      options,
    });
    if (
      !rows ||
      rows.some(
        (row) =>
          typeof row.id !== "string" ||
          !matches(row, filters) ||
          result.some((entry) => entry.id === row.id),
      )
    )
      throw new Error(`Unexpected reference lookup result in ${entity}`);
    result.push(...rows.map(({ id }) => ({ entity, id: id as string })));
    if (rows.length < 100) return result;
  }
}

async function read(target: ITarget) {
  const { sdk, options, kind } = await resolveSdk(target.entity);
  const records = await sdk.find({
    params: {
      filters: { and: [{ column: "id", method: "eq", value: target.id }] },
    },
    options,
  });
  if (
    !records ||
    records.length > 1 ||
    records.some(({ id }) => id !== target.id)
  )
    throw new Error(`Unexpected SDK result for ${target.entity} ${target.id}`);
  return { row: records[0], sdk, options, kind };
}

async function main() {
  cutoverApiOrigin(API_SERVICE_URL ?? "");
  if (!RBAC_SECRET_KEY) throw new Error("RBAC_SECRET_KEY is required");

  const mode = process.argv[2] ?? "check";
  if (process.argv.length > 3 || !["check", "apply"].includes(mode))
    throw new Error("Expected check or apply");
  const apply = mode === "apply";
  const updates = [];
  const deletions = [];

  for (const target of cutover.updates) {
    const { row, sdk, options } = await read(target);
    if (!row)
      throw new Error(`Target missing for ${target.entity} ${target.id}`);
    if (matches(row, target.data)) continue;
    const changedFields = Object.entries(target.before).filter(
      ([field, value]) =>
        !isDeepStrictEqual(row[field], value) &&
        !isDeepStrictEqual(row[field], (target.data as IFields)[field]),
    );
    if (changedFields.length)
      throw new Error(
        `Unexpected saved fields for ${target.entity} ${target.id}: ${changedFields.map(([field]) => field).join(", ")}`,
      );
    updates.push({ target, sdk, options, row });
  }
  for (const target of cutover.deletions) {
    const { row, kind } = await read(target);
    if (!row) continue;
    if (!matches(row, target.expected))
      throw new Error(`Unexpected record for ${target.entity} ${target.id}`);
    deletions.push({ target, kind });
  }

  const models = deletions.filter(({ kind }) => kind === "model");
  const relations = deletions.filter(({ kind }) => kind === "relation");
  const descriptors = models.length ? await listContentEntityDescriptors() : [];
  const plannedDeletes = new Set(deletions.map(({ target }) => key(target)));
  const plannedUpdates = new Map(
    updates.map(({ target }) => [key(target), target]),
  );
  for (const { target } of models) {
    await assertRetiredContentUnreferenced(
      target,
      descriptors,
      findReferences,
      plannedDeletes,
      plannedUpdates,
    );
  }

  if (apply) {
    for (const { target, sdk, options, row } of updates) {
      const { id, createdAt, updatedAt, ...fields } = row;
      await sdk.update({
        id: target.id,
        data: { ...fields, ...target.data },
        options,
      });
      const after = await read(target);
      if (!after.row || !matches(after.row, target.data))
        throw new Error(
          `Update readback failed for ${target.entity} ${target.id}`,
        );
    }
    for (const { target, kind } of [...relations, ...models]) {
      const { row, sdk, options } = await read(target);
      if (!row) continue;
      if (!matches(row, target.expected))
        throw new Error(`Record changed before deletion: ${key(target)}`);
      if (kind === "model")
        await assertRetiredContentUnreferenced(
          target,
          descriptors,
          findReferences,
        );
      await sdk.delete({ id: target.id, options });
      if ((await read(target)).row)
        throw new Error(
          `Delete readback failed for ${target.entity} ${target.id}`,
        );
    }
  }

  console.log(
    JSON.stringify({
      mode,
      updates: updates.length,
      deletions: deletions.length,
    }),
  );
}

if (import.meta.main) await main();
