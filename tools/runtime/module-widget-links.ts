import { randomUUID } from "node:crypto";
import { readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import { parseArgs } from "node:util";
import { API_SERVICE_URL } from "@sps/shared-utils";
import {
  applyWidgetCutover,
  rollbackWidgetCutover,
  cutoverApiOrigin,
  type IWidgetCutoverAdapter,
  type IWidgetCutoverManifest,
} from "./ai-chat-widget-links";

export interface IModuleWidgetInput {
  targets: { hostLinkId: string; sourceWidgetId: string }[];
}
export interface IModuleWidgetCutoverConfig {
  sourceModule: "social" | "ecommerce";
  schema: IWidgetCutoverManifest["schema"];
  variants: Readonly<Record<string, string>>;
  presentationVariant: string;
  slugPrefix: string;
}
const equal = (a: unknown, b: unknown): boolean => {
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => equal((a as any)[key], (b as any)[key]))
    );
  }
  return a === b;
};
/** Prepare exact instance bindings without changing source Widgets or content. */
export async function prepareModuleWidgetCutover(
  config: IModuleWidgetCutoverConfig,
  input: IModuleWidgetInput,
  adapter: IWidgetCutoverAdapter,
): Promise<IWidgetCutoverManifest> {
  if (
    !input.targets?.length ||
    input.targets.some(
      (t) => !t.hostLinkId?.trim() || !t.sourceWidgetId?.trim(),
    ) ||
    new Set(input.targets.map((t) => t.hostLinkId)).size !==
      input.targets.length
  )
    throw Error("Provide distinct explicit Host link IDs");
  const manifest: IWidgetCutoverManifest = {
    schema: config.schema,
    createdAt: new Date().toISOString(),
    status: "prepared",
    checks: [],
    operations: [],
  };
  async function find(entity: string, selector: Record<string, unknown>) {
    return (
      (await (
        await adapter(entity)
      ).find({
        params: {
          limit: 2,
          filters: {
            and: Object.entries(selector).map(([column, value]) => ({
              column,
              method: "eq",
              value,
            })),
          },
        },
      })) ?? []
    );
  }
  async function read(entity: string, id: string) {
    const rows = await find(entity, { id });
    if (rows.length !== 1) throw Error(`Expected exact ${entity}:${id}`);
    if (!manifest.checks.some((c) => c.entity === entity && c.record.id === id))
      manifest.checks.push({ entity, record: rows[0] });
    return rows[0];
  }
  async function ensure(entity: string, data: Record<string, unknown>) {
    const pending = manifest.operations.find(
      (op) => op.entity === entity && op.data.slug === data.slug,
    );
    if (pending) return pending.data;
    const selector = { slug: data.slug };
    const rows = await find(entity, selector);
    if (rows.length > 1) throw Error(`Ambiguous ${entity} slug`);
    if (rows.length) {
      if (
        !Object.entries(data).every(([key, value]) =>
          equal(rows[0][key], value),
        )
      )
        throw Error(`Existing ${entity} differs from prepared content`);
      await read(entity, String(rows[0].id));
      return rows[0];
    }
    const record = { id: randomUUID(), ...data };
    manifest.operations.push({
      entity,
      id: record.id,
      before: null,
      data: record,
      selector,
    });
    return record;
  }
  const switches: IWidgetCutoverManifest["operations"] = [];
  for (const target of input.targets) {
    const host = await read(
      "host.widgets-to-external-widgets",
      target.hostLinkId,
    );
    const source = await read(
      `${config.sourceModule}.widget`,
      target.sourceWidgetId,
    );
    const variant = config.variants[String(source.variant)];
    if (!variant) throw Error("Unsupported source Widget scenario");
    if (host.variant !== "default")
      throw Error("Only default Host associations can be migrated");
    const slug = `${config.slugPrefix}-${source.id}`;
    const presentation = await ensure(
      "website-builder.widget",
      Object.fromEntries(
        Object.entries({
          slug,
          variant: config.presentationVariant,
          adminTitle: source.adminTitle,
          title: source.title,
          subtitle: source.subtitle,
          description: source.description,
          className: source.className,
          anchor: source.anchor,
        }).filter(([, value]) => value !== undefined),
      ),
    );
    const functional = await ensure("rbac.widget", {
      slug,
      variant,
      adminTitle: source.adminTitle,
    });
    const relationEntity = "rbac.widgets-to-website-builder-module-widgets";
    const selector = {
      widgetId: functional.id,
      websiteBuilderModuleWidgetId: presentation.id,
    };
    const linked = await find(relationEntity, { widgetId: functional.id });
    if (
      linked.some(
        (link) => link.websiteBuilderModuleWidgetId !== presentation.id,
      )
    )
      throw Error(
        "Functional Widget already has a different presentation; preserve it and choose another source mapping",
      );
    const existing = await find(relationEntity, selector);
    if (existing.length > 1) throw Error("Duplicate presentation association");
    if (existing.length) {
      if (existing[0].variant !== "default")
        throw Error("Non-default presentation association");
      await read(relationEntity, String(existing[0].id));
    } else if (
      !manifest.operations.some(
        (op) => op.entity === relationEntity && equal(op.selector, selector),
      )
    ) {
      const id = randomUUID();
      manifest.operations.push({
        entity: relationEntity,
        id,
        before: null,
        selector,
        data: { id, ...selector, variant: "default" },
      });
    }
    // Seed matching uses the original Host Widget + external Widget pair.
    // Preserve that natural key as an inactive association before switching the active ID.
    const legacySelector = {
      widgetId: host.widgetId,
      externalModule: config.sourceModule,
      externalWidgetId: source.id,
      variant: "hidden",
    };
    const legacy = await find(
      "host.widgets-to-external-widgets",
      legacySelector,
    );
    if (legacy.length > 1) throw Error("Duplicate retired source associations");
    if (legacy.length)
      await read("host.widgets-to-external-widgets", String(legacy[0].id));
    else if (
      !manifest.operations.some(
        (op) =>
          op.entity === "host.widgets-to-external-widgets" &&
          equal(op.selector, legacySelector),
      )
    ) {
      const id = randomUUID();
      manifest.operations.push({
        entity: "host.widgets-to-external-widgets",
        id,
        before: null,
        selector: legacySelector,
        data: {
          id,
          ...legacySelector,
          orderIndex: host.orderIndex ?? 0,
          className: host.className ?? null,
        },
      });
    }
    const data = { externalModule: "rbac", externalWidgetId: functional.id };
    if (
      host.externalModule === "rbac" &&
      host.externalWidgetId === functional.id
    )
      continue;
    if (
      host.externalModule !== config.sourceModule ||
      host.externalWidgetId !== source.id
    )
      throw Error("Host binding does not match the explicit source Widget");
    switches.push({
      entity: "host.widgets-to-external-widgets",
      id: String(host.id),
      before: host,
      data,
    });
  }
  manifest.operations.push(...switches);
  return manifest;
}

export async function runWidgetCutoverCli<TInput>(
  schema: IWidgetCutoverManifest["schema"],
  prepare: (
    input: TInput,
    adapter: IWidgetCutoverAdapter,
  ) => Promise<IWidgetCutoverManifest>,
) {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: { "allow-api-origin": { type: "string" } },
  });
  const [mode, inputPath, manifestPath] = positionals;
  if (
    !["prepare", "apply", "rollback"].includes(mode) ||
    !inputPath ||
    (mode === "prepare" && !manifestPath)
  )
    throw Error(
      "Usage: <module>-widget-links.ts prepare <explicit-input.json> <new-manifest.json> | apply|rollback <manifest.json>",
    );
  const origin = cutoverApiOrigin(
    API_SERVICE_URL ?? "",
    values["allow-api-origin"],
  );
  const { getContentEntityDescriptor } = await import(
    "../../apps/mcp/lib/content-management/registry"
  );
  const adapter: IWidgetCutoverAdapter = async (entity) => {
    const descriptor = await getContentEntityDescriptor(entity);
    if (!descriptor) throw Error(`Unknown entity ${entity}`);
    return Object.fromEntries(
      Object.entries(descriptor.api).map(([key, fn]) => [
        key,
        typeof fn === "function"
          ? (props: any) =>
              fn({
                ...props,
                host: origin.origin,
                options: {
                  ...props?.options,
                  cache: "no-store",
                  headers: {
                    "X-RBAC-SECRET-KEY": process.env.RBAC_SECRET_KEY!,
                    "Cache-Control": "no-cache",
                  },
                },
              })
          : fn,
      ]),
    ) as any;
  };
  const destination = mode === "prepare" ? manifestPath : inputPath;
  const lock = await open(`${destination}.lock`, "wx");
  const persist = async (manifest: IWidgetCutoverManifest) => {
    const tmp = `${destination}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(manifest, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(tmp, destination);
  };
  try {
    if (mode === "prepare") {
      try {
        await readFile(destination);
        throw Error("Before manifest already exists");
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
      const manifest = await prepare(
        JSON.parse(await readFile(inputPath, "utf8")),
        adapter,
      );
      manifest.apiOrigin = origin.origin;
      await persist(manifest);
      console.log({ operations: manifest.operations.length });
    } else {
      const manifest: IWidgetCutoverManifest = JSON.parse(
        await readFile(inputPath, "utf8"),
      );
      if (manifest.schema !== schema || manifest.apiOrigin !== origin.origin)
        throw Error("Manifest does not belong to this migration/API");
      if (mode === "apply")
        console.log(await applyWidgetCutover(manifest, adapter, persist));
      else await rollbackWidgetCutover(manifest, adapter, persist);
    }
  } finally {
    await lock.close();
    await unlink(`${destination}.lock`);
  }
}
