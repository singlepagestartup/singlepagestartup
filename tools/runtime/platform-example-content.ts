import { randomUUID } from "node:crypto";
import { open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { API_SERVICE_URL } from "@sps/shared-utils";
import {
  applyWidgetCutover,
  rollbackWidgetCutover,
  type IWidgetCutoverAdapter,
  type IWidgetCutoverManifest,
  type IWidgetCutoverOperation,
} from "./ai-chat-widget-links";

interface IRecord {
  id: string;
  [field: string]: unknown;
}
interface ISelection {
  entity: string;
  selector: Record<string, unknown>;
}
interface ITarget extends ISelection {
  key: string;
  id?: string;
  data: Record<string, unknown>;
  switch?: boolean;
  retainOnRollback?: boolean;
  requiresCommercialConfirmation?: boolean;
}
export interface IPlatformInput {
  schema: "sps.platform-example-input.v1";
  targets: ITarget[];
  protectedSelections: ISelection[];
  commercialConfirmation?: {
    source: string;
    proPeriod: string;
    prices: { currency: string; amount: number }[];
    tokenRate: number;
    packs: { price: number; credits: number }[];
  };
}
export interface IPlatformManifest extends IWidgetCutoverManifest {
  schema: "sps.platform-example-cutover.v1";
  input: IPlatformInput;
  protectedSelections: (ISelection & { rows: IRecord[] })[];
  switchIds: string[];
}
const stable = (value: unknown): string => {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
};
const matches = (row: IRecord, data: Record<string, unknown>) =>
  Object.entries(data).every(
    ([key, item]) => stable(row[key]) === stable(item),
  );

async function find(adapter: IWidgetCutoverAdapter, selection: ISelection) {
  const rows: IRecord[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await (
      await adapter(selection.entity)
    ).find({
      params: {
        limit: 100,
        offset,
        orderBy: { and: [{ column: "id", method: "asc" }] },
        filters: {
          and: Object.entries(selection.selector).map(([column, value]) => ({
            column,
            method: "eq",
            value,
          })),
        },
      },
    });
    if (!Array.isArray(page)) throw Error(`Unreadable ${selection.entity}`);
    for (const row of page) {
      if (rows.some((prior) => prior.id === row.id))
        throw Error(`Unstable pagination ${selection.entity}`);
      rows.push(row as IRecord);
    }
    if (page.length < 100) return rows;
  }
}

function resolve(value: unknown, ids: Map<string, string>): any {
  if (Array.isArray(value)) return value.map((item) => resolve(item, ids));
  if (value && typeof value === "object") {
    if (Object.keys(value).length === 1 && "$ref" in value) {
      const id = ids.get(String(value.$ref));
      if (!id) throw Error(`Unknown or forward reference ${value.$ref}`);
      return id;
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolve(item, ids)]),
    );
  }
  return value;
}

export async function preparePlatformExamples(
  input: IPlatformInput,
  adapter: IWidgetCutoverAdapter,
): Promise<IPlatformManifest> {
  if (
    input.schema !== "sps.platform-example-input.v1" ||
    !input.targets.length ||
    !input.protectedSelections.length
  )
    throw Error("Explicit platform targets are required");
  const keys = input.targets.map((target) => target.key);
  if (keys.some((key) => !key) || new Set(keys).size !== keys.length)
    throw Error("Target keys must be unique");
  if (input.targets.some((target) => target.requiresCommercialConfirmation)) {
    const terms = input.commercialConfirmation;
    if (
      !terms?.source ||
      !terms.proPeriod ||
      !terms.prices.length ||
      !terms.packs.length ||
      !Number.isFinite(terms.tokenRate) ||
      terms.tokenRate <= 0 ||
      [
        ...terms.prices.map((price) => price.amount),
        ...terms.packs.flatMap((pack) => [pack.price, pack.credits]),
      ].some((value) => !Number.isFinite(value) || value <= 0)
    )
      throw Error("Confirmed commercial terms are required");
  }
  const ids = new Map<string, string>();
  const selectedRecords = new Set<string>();
  const operations: IWidgetCutoverOperation[] = [];
  const checks: IPlatformManifest["checks"] = [];
  const switchIds: string[] = [];
  for (const target of input.targets) {
    if (!Object.keys(target.selector).length)
      throw Error(`An exact selector is required for ${target.key}`);
    const selector = resolve(target.selector, ids);
    const data = resolve(target.data, ids);
    if (
      Object.keys(data).some((key) =>
        ["id", "createdAt", "updatedAt"].includes(key),
      )
    )
      throw Error("IDs and timestamps are server-owned");
    const rows = await find(adapter, {
      entity: target.entity,
      selector: target.id ? { id: target.id } : selector,
    });
    if (rows.length > 1 || (target.id && rows.length !== 1))
      throw Error(`Missing or ambiguous target ${target.key}`);
    const before = rows[0];
    const identity = `${target.entity}:${before?.id ?? stable(selector)}`;
    if (selectedRecords.has(identity))
      throw Error(`Duplicate target record ${target.key}`);
    selectedRecords.add(identity);
    if (before && !matches(before, selector))
      throw Error(`Target selector changed for ${target.key}`);
    if (!before && (!matches({ id: "", ...data }, selector) || target.switch))
      throw Error(
        `New target must contain its selector and cannot switch an existing consumer: ${target.key}`,
      );
    const id = before?.id ?? randomUUID();
    ids.set(target.key, id);
    if (before) checks.push({ entity: target.entity, record: before });
    if (before && matches(before, data)) continue;
    operations.push({
      entity: target.entity,
      id,
      before: before ?? null,
      data,
      selector,
      retainOnRollback: target.retainOnRollback,
    });
    if (target.switch) switchIds.push(id);
  }
  // Existing consumers switch only after all new records and links read back.
  operations.sort(
    (a, b) =>
      Number(switchIds.includes(a.id)) - Number(switchIds.includes(b.id)),
  );
  const protectedSelections: IPlatformManifest["protectedSelections"] = [];
  for (const selection of input.protectedSelections) {
    protectedSelections.push({
      ...selection,
      rows: await find(adapter, selection),
    });
  }
  for (const operation of operations) {
    if (
      protectedSelections.some(
        (selection) =>
          selection.entity === operation.entity &&
          selection.rows.some((row) => row.id === operation.id),
      )
    )
      throw Error("A protected record cannot be a publication target");
  }
  return {
    schema: "sps.platform-example-cutover.v1",
    createdAt: new Date().toISOString(),
    status: "prepared",
    input,
    checks,
    operations,
    protectedSelections,
    switchIds,
  };
}

async function verifyProtected(
  manifest: IPlatformManifest,
  adapter: IWidgetCutoverAdapter,
) {
  for (const selection of manifest.protectedSelections) {
    if (stable(await find(adapter, selection)) !== stable(selection.rows))
      throw Error(`Protected selection changed: ${selection.entity}`);
  }
}

export async function verifyPlatformExamples(
  manifest: IPlatformManifest,
  adapter: IWidgetCutoverAdapter,
) {
  await verifyProtected(manifest, adapter);
  for (const operation of manifest.operations) {
    const rows = await find(adapter, {
      entity: operation.entity,
      selector: { id: operation.id },
    });
    if (
      rows.length !== 1 ||
      !matches(rows[0], operation.data) ||
      (operation.result && stable(rows[0]) !== stable(operation.result))
    )
      throw Error(
        `Publication readback changed: ${operation.entity}:${operation.id}`,
      );
  }
}

export async function applyPlatformExamples(
  manifest: IPlatformManifest,
  adapter: IWidgetCutoverAdapter,
  persist: (manifest: IPlatformManifest) => Promise<void>,
) {
  await verifyProtected(manifest, adapter);
  const guardedAdapter: IWidgetCutoverAdapter = async (entity) => {
    const api = await adapter(entity);
    return {
      ...api,
      update: async (props) => {
        if (manifest.switchIds.includes(props.id))
          await verifyProtected(manifest, adapter);
        return api.update(props);
      },
    };
  };
  const result = await applyWidgetCutover(manifest, guardedAdapter, async () =>
    persist(manifest),
  );
  await verifyPlatformExamples(manifest, adapter);
  return result;
}

export async function rollbackPlatformExamples(
  manifest: IPlatformManifest,
  adapter: IWidgetCutoverAdapter,
  persist: (manifest: IPlatformManifest) => Promise<void>,
) {
  await verifyProtected(manifest, adapter);
  await rollbackWidgetCutover(manifest, adapter, async () => persist(manifest));
  await verifyProtected(manifest, adapter);
}

export async function platformExampleCli(argv = process.argv.slice(2)) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { "exclusive-maintenance": { type: "boolean", default: false } },
  });
  const [mode, inputPath, manifestPath] = positionals;
  if (
    !["prepare", "apply", "verify", "rollback"].includes(mode) ||
    !inputPath ||
    positionals.length !== (mode === "prepare" ? 3 : 2)
  )
    throw Error(
      "Usage: platform-example-content.ts prepare <input.json> <new-manifest.json> | apply|verify|rollback <manifest.json>",
    );
  if (["apply", "rollback"].includes(mode) && !values["exclusive-maintenance"])
    throw Error(
      "Stop other CMS, billing job and webhook writers before exclusive maintenance",
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
      "An explicit credential-free localhost:4000 API_SERVICE_URL is required",
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
  const persist = async (manifest: IPlatformManifest) => {
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
      const input = JSON.parse(await readFile(inputPath, "utf8"));
      const manifest = await preparePlatformExamples(input, adapter);
      manifest.apiOrigin = origin.origin;
      await persist(manifest);
      console.log(
        JSON.stringify({
          operations: manifest.operations.length,
          protectedSelections: manifest.protectedSelections.length,
        }),
      );
    } else {
      const manifest: IPlatformManifest = JSON.parse(
        await readFile(inputPath, "utf8"),
      );
      if (
        manifest.schema !== "sps.platform-example-cutover.v1" ||
        manifest.apiOrigin !== origin.origin
      )
        throw Error("Manifest origin or schema mismatch");
      const result =
        mode === "apply"
          ? await applyPlatformExamples(manifest, adapter, persist)
          : mode === "rollback"
            ? await rollbackPlatformExamples(manifest, adapter, persist)
            : await verifyPlatformExamples(manifest, adapter);
      console.log(JSON.stringify({ mode, status: manifest.status, result }));
    }
  } finally {
    await lock.close();
    await unlink(`${destination}.lock`);
  }
}

if (import.meta.main)
  platformExampleCli().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
