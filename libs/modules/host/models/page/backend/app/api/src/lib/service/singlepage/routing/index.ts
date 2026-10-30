import { getTableColumns } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import QueryString from "qs";
import {
  API_SERVICE_URL,
  responsePipe,
  SEO_SITEMAP_MAX_CANDIDATES,
} from "@sps/shared-utils";
import type { FindServiceProps } from "@sps/shared-backend-api";

export interface IRouteRecord {
  id: string;
  [field: string]: unknown;
}
export interface IRouteSource {
  name: string;
  route: string;
  table: PgTable;
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
    const references = getTableConfig(definition.table).foreignKeys.map(
      (key) => {
        const reference = key.reference();
        const target = [...this.sources.values()].find(
          (entry) => entry.table === reference.foreignTable,
        );
        const field = Object.entries(getTableColumns(definition.table)).find(
          ([, column]) => column === reference.columns[0],
        )?.[0];
        return { target: target?.name, field };
      },
    );
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

  async all(
    name: string,
    params: FindServiceProps["params"] = {},
  ): Promise<IRouteRecord[]> {
    const source = this.sources.get(name);
    if (!source) throw new Error("Validation error. Unknown route source");
    const columns = getTableColumns(source.table);
    const orderBy = params.orderBy || {
      and: [
        ...("orderIndex" in columns
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
