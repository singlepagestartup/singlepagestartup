import QueryString from "qs";
import { factory } from "@sps/shared-frontend-server-api";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import {
  API_SERVICE_URL,
  responsePipe,
  SEO_SITEMAP_MAX_CANDIDATES,
} from "@sps/shared-utils";
import type {
  FindServiceProps,
  IResourceDescription,
} from "@sps/shared-backend-api";

export interface IRouteRecord {
  id: string;
  [field: string]: unknown;
}
export interface IRouteSource {
  name: string;
  route: string;
  resource: IResourceDescription;
}
export interface IRouteRelation {
  source: string;
  sourceKey: string;
  target: string;
  targetKey: string;
}

/** Registered API contracts describe URL sources; publication belongs to Page. */
export class RoutingService {
  private readonly sources: Map<string, IRouteSource>;
  constructor(sources: IRouteSource[] = []) {
    this.sources = new Map(sources.map((source) => [source.name, source]));
  }

  relation(name: string, source: string): IRouteRelation {
    const definition = this.sources.get(name);
    if (!definition)
      throw new Error("Validation error. Unknown route relation");
    const references = definition.resource.references.map((reference) => {
      const target = [...this.sources.values()].find(
        (entry) => entry.resource.table === reference.table,
      );
      return { target: target?.name, field: reference.column };
    });
    const left = references.filter((reference) => reference.target === source);
    const right = references.filter((reference) => reference.target !== source);
    if (
      references.length !== 2 ||
      left.length !== 1 ||
      right.length !== 1 ||
      !left[0].field ||
      !right[0].field ||
      !right[0].target
    )
      throw new Error("Validation error. Ambiguous route relation");
    return {
      source,
      sourceKey: left[0].field,
      target: right[0].target,
      targetKey: right[0].field,
    };
  }

  async find(
    name: string,
    params: FindServiceProps["params"] = {},
  ): Promise<IRouteRecord[]> {
    const source = this.sources.get(name);
    if (!source) throw new Error("Validation error. Unknown route source");
    const query = QueryString.stringify(params, { encodeValuesOnly: true });
    const res = await fetch(API_SERVICE_URL + source.route + "?" + query, {
      headers: { "Cache-Control": "no-store", "X-SPS-Consistency": "1" },
    });
    const payload = await responsePipe<{ data: IRouteRecord[] }>({ res });
    if (!Array.isArray(payload?.data))
      throw new Error("Route source unavailable");
    return payload.data;
  }

  async findById(name: string, id: string): Promise<IRouteRecord | undefined> {
    const source = this.sources.get(name);
    if (!source) throw new Error("Validation error. Unknown route source");
    try {
      return await factory<IRouteRecord>({
        host: API_SERVICE_URL,
        route: source.route,
      }).findById({
        id: encodeURIComponent(id),
        options: {
          headers: { "Cache-Control": "no-store", "X-SPS-Consistency": "1" },
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      )
        return undefined;
      throw error;
    }
  }

  async resolve(
    name: string,
    column: string,
    value: string,
  ): Promise<IRouteRecord[]> {
    if (column === "id") {
      const record = await this.findById(name, value);
      return record ? [record] : [];
    }
    try {
      return await this.find(name, {
        filters: { and: [{ column, method: "eq", value }] },
        limit: 2,
      });
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        !("status" in error) ||
        ![401, 403].includes(Number(error.status))
      )
        throw error;
      return (await this.exactPublicRecords(name)).filter(
        (record) => String(record[column]) === value,
      );
    }
  }

  private async readableRecords(
    name: string,
    ids: string[],
  ): Promise<IRouteRecord[]> {
    if (ids.length > SEO_SITEMAP_MAX_CANDIDATES)
      throw new Error(
        "Validation error. Route enumeration exceeds the URL limit",
      );
    const records: IRouteRecord[] = [];
    for (let offset = 0; offset < ids.length; offset += 100) {
      const batch = await Promise.all(
        ids.slice(offset, offset + 100).map(async (id) => {
          try {
            return await this.findById(name, id);
          } catch (error) {
            if (
              error &&
              typeof error === "object" &&
              "status" in error &&
              [401, 403].includes(Number(error.status))
            )
              return undefined;
            throw error;
          }
        }),
      );
      records.push(
        ...batch.filter((record): record is IRouteRecord => !!record),
      );
    }
    return records;
  }

  private async exactPublicRecords(name: string): Promise<IRouteRecord[]> {
    const source = this.sources.get(name);
    if (!source) throw new Error("Validation error. Unknown route source");
    const ids = await permissionApi.publicResourceIds({
      params: { resource: source.route },
    });
    return this.readableRecords(name, ids);
  }

  async enumerate(name: string, column?: string): Promise<IRouteRecord[]> {
    let records: IRouteRecord[];
    try {
      records = await this.all(name);
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        !("status" in error) ||
        ![401, 403].includes(Number(error.status))
      )
        throw error;
      return this.exactPublicRecords(name);
    }
    return column === "id"
      ? this.readableRecords(
          name,
          records.map(({ id }) => id),
        )
      : records;
  }

  async all(
    name: string,
    params: FindServiceProps["params"] = {},
  ): Promise<IRouteRecord[]> {
    const source = this.sources.get(name);
    if (!source) throw new Error("Validation error. Unknown route source");
    const columns = source.resource.columns;
    const orderBy = params.orderBy || {
      and: [
        ...(columns.includes("orderIndex")
          ? [{ column: "orderIndex", method: "asc" as const }]
          : []),
        { column: "id", method: "asc" as const },
      ],
    };
    const result: IRouteRecord[] = [];
    for (let offset = 0; ; offset += 100) {
      const batch = await this.find(name, {
        ...params,
        orderBy,
        offset,
        limit: 100,
      });
      result.push(...batch);
      if (result.length > SEO_SITEMAP_MAX_CANDIDATES)
        throw new Error(
          "Validation error. Route enumeration exceeds the URL limit",
        );
      if (batch.length < 100) return result;
    }
  }
}
