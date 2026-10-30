import type { IResolvedPage } from "@sps/host/models/page/sdk/model";
import type { ISeoImage } from "@sps/host/models/metadata/sdk/model";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  MetadataMaskError,
  metadataPathValue,
  type IMetadataReference,
} from "@sps/shared-utils";
import {
  RoutingService,
  type IRouteRecord,
} from "@sps/host/models/page/backend/app/api/src/lib/service/singlepage/routing";
import { absoluteHttpUrl, decodeRouteValue, plainText } from "./utils";

export function fileImage(file: IRouteRecord): ISeoImage | undefined {
  if (
    typeof file.file !== "string" ||
    typeof file.mimeType !== "string" ||
    !file.mimeType.startsWith("image/")
  )
    return;
  const url = absoluteHttpUrl(
    file.file.startsWith("/") ? "/public" + file.file : file.file,
    NEXT_PUBLIC_API_SERVICE_URL.replace(/\/$/, "") + "/public/",
  );
  if (!url) return;
  return {
    url,
    ...(typeof file.width === "number" && file.width > 0
      ? { width: file.width }
      : {}),
    ...(typeof file.height === "number" && file.height > 0
      ? { height: file.height }
      : {}),
    ...(typeof file.alt === "string" ? { alt: file.alt } : {}),
  };
}

/** Values are read only when referenced by the selected Page's Metadata masks. */
export function createMetadataContext(
  page: IResolvedPage,
  language: string,
  routing: RoutingService,
) {
  const roots = new Map<string, Promise<IRouteRecord | undefined>>();
  const reads = new Map<string, Promise<IRouteRecord[]>>();
  roots.set("host.pages", Promise.resolve(page as unknown as IRouteRecord));
  async function read(
    name: string,
    column: string,
    value: string,
    many = false,
  ) {
    const key = name + ":" + column + ":" + value + ":" + many;
    if (!reads.has(key))
      reads.set(
        key,
        (async () => {
          try {
            return many
              ? await routing.all(name, {
                  filters: { and: [{ column, method: "eq", value }] },
                })
              : await routing.find(name, {
                  filters: { and: [{ column, method: "eq", value }] },
                  limit: 2,
                });
          } catch (error) {
            if (
              error &&
              typeof error === "object" &&
              "status" in error &&
              [401, 403, 404].includes(Number(error.status))
            )
              throw new MetadataMaskError(
                "Unavailable public metadata source: " + name,
              );
            throw error;
          }
        })(),
      );
    return reads.get(key)!;
  }
  async function root(name: string) {
    if (roots.has(name)) return roots.get(name);
    const key = Object.keys(page.routeParams || {}).find(
      (key) => key.startsWith(name + ".") && !key.includes(":"),
    );
    if (!key) throw new MetadataMaskError("No route context for " + name);
    const field = key.slice(name.length + 1);
    const value = decodeRouteValue(page.routeParams[key]!);
    const promise = read(name, field, value).then((records) => {
      if (records.length !== 1)
        throw new MetadataMaskError(
          "Metadata reference must select one record",
        );
      return records[0];
    });
    roots.set(name, promise);
    return promise;
  }
  async function traverse(
    source: string,
    records: IRouteRecord[],
    chain: string[],
  ) {
    let current = source;
    for (const name of chain) {
      let relation: ReturnType<RoutingService["relation"]>;
      try {
        relation = routing.relation(name, current);
      } catch {
        throw new MetadataMaskError(
          "Unavailable or ambiguous relation: " + name,
        );
      }
      const linked: IRouteRecord[] = [];
      for (const record of records) {
        for (const link of await read(
          name,
          relation.sourceKey,
          record.id,
          true,
        )) {
          const id = link[relation.targetKey];
          if (typeof id === "string")
            linked.push(...(await read(relation.target, "id", id)));
        }
      }
      records = [
        ...new Map(linked.map((record) => [record.id, record])).values(),
      ];
      current = relation.target;
    }
    return { source: current, records };
  }
  return {
    async resolve(reference: IMetadataReference) {
      const entity = await root(reference.source);
      if (!entity)
        throw new MetadataMaskError("No route context for " + reference.source);
      const { source, records } = await traverse(
        reference.source,
        [entity],
        reference.relations,
      );
      if (source !== reference.target || records.length !== 1)
        throw new MetadataMaskError(
          "Metadata reference must select one matching record",
        );
      if (reference.path[0] === "file") return fileImage(records[0])?.url;
      const value = metadataPathValue(records[0], reference.path, language);
      return typeof value === "string" ? plainText(value) : value;
    },
    async metadataImage(entity: IRouteRecord) {
      const { records } = await traverse(
        "host.metadata",
        [entity],
        ["host.metadata-to-file-storage-module-files"],
      );
      return records.map(fileImage).find(Boolean);
    },
    setMetadata(entity: IRouteRecord) {
      roots.set("host.metadata", Promise.resolve(entity));
    },
  };
}
