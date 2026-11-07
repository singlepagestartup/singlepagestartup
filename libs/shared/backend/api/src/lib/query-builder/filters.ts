import { Column, SQL, getOperators, is, sql } from "drizzle-orm";
import { PgTableWithColumns } from "drizzle-orm/pg-core";

interface QueryBuilderFilterMethods extends ReturnType<typeof getOperators> {}

export interface IFilter {
  column: string;
  method: keyof QueryBuilderFilterMethods;
  value: any;
}

export interface QueryBuilderProps<T extends PgTableWithColumns<any>> {
  table: Partial<T>;
  queryFunctions: QueryBuilderFilterMethods;
  filters?: {
    ["and"]: IFilter[];
  };
}

/**
 * Comparison methods this builder compiles into a predicate. A method outside
 * the list used to match no branch and produce no predicate at all, so the
 * query answered with unfiltered rows instead of refusing the request.
 */
export const ALLOWED_FILTER_METHODS = Object.freeze([
  "eq",
  "ne",
  "not",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "notLike",
  "notIlike",
  "inArray",
  "notInArray",
  "isNull",
  "isNotNull",
] as const);

export type IAllowedFilterMethod = (typeof ALLOWED_FILTER_METHODS)[number];

export const MAX_FILTERS = 32;
export const MAX_JSON_KEY_LENGTH = 64;

/**
 * A plain column identifier followed by at most one json key. The key also
 * accepts "-" because the only live caller derives it from configured language
 * codes, which downstream projects extend with forms such as "en-US".
 */
const FILTER_COLUMN_PATTERN =
  /^[A-Za-z_][A-Za-z0-9_]*(->>[A-Za-z_][A-Za-z0-9_-]*)?$/;

function castToText(column: any): SQL {
  return sql`CAST(${column} AS TEXT)`;
}

/**
 * The json key is an argument of "->>", so it belongs in the parameter list
 * like any other value. Drizzle's raw-fragment escape hatch must never return
 * to this file: it would let request text decide the structure of the
 * statement again. The cast pins the "jsonb ->> text" overload, which an
 * untyped parameter would otherwise leave to Postgres to resolve.
 */
function jsonPathExpression(column: any, key: string): SQL {
  return sql`${column}->>${key}::text`;
}

function parseFilterMethod(method: unknown): IAllowedFilterMethod {
  if (!method) {
    throw new Error("Validation error. Missing 'method' in filter object");
  }

  if (
    typeof method !== "string" ||
    !ALLOWED_FILTER_METHODS.includes(method as IAllowedFilterMethod)
  ) {
    throw new Error(`Validation error. Unknown filter method '${method}'`);
  }

  return method as IAllowedFilterMethod;
}

function parseFilterColumn(column: unknown): {
  name: string;
  jsonKey?: string;
} {
  if (typeof column !== "string" || !column.trim()) {
    throw new Error("Validation error. Missing 'column' in filter object");
  }

  const trimmed = column.trim();

  if (!FILTER_COLUMN_PATTERN.test(trimmed)) {
    throw new Error(
      "Validation error. Filter column must be an identifier, optionally followed by '->>' and one json key",
    );
  }

  const [name, jsonKey] = trimmed.split("->>");

  if (jsonKey && jsonKey.length > MAX_JSON_KEY_LENGTH) {
    throw new Error(
      `Validation error. Json key is longer than ${MAX_JSON_KEY_LENGTH} characters`,
    );
  }

  return { name, jsonKey };
}

/**
 * {
 *  ...,
 *  "filters": {
 *      "and": [
 *          {
 *              "column": "title",
 *              "method": "eq"
 *              "value": "Hello" | 1 | undefined | true | 2,30
 *          }
 *      ]
 *  }
 * }
 */
export const queryBuilder = <T extends PgTableWithColumns<any>>(
  params: QueryBuilderProps<T>,
) => {
  const { table, queryFunctions, filters } = params;

  if (!filters) {
    return;
  }

  const filterTypes = Object.keys(filters);
  if (filterTypes.find((filterType) => filterType !== "and")) {
    throw new Error(
      `Validation error. You are using wrong filter type, allowed types: [${["'and'"].join(", ")}]`,
    );
  }

  const filterArrays = filters["and"];

  if (!Array.isArray(filterArrays)) {
    throw new Error("Validation error. 'filters.and' must be an array");
  }

  if (filterArrays.length > MAX_FILTERS) {
    throw new Error(
      `Validation error. Too many filters, maximum is ${MAX_FILTERS}`,
    );
  }

  const resultQueries: (SQL<any> | undefined)[] = [];

  for (const filter of filterArrays) {
    const method = parseFilterMethod(filter?.method);
    const { name, jsonKey } = parseFilterColumn(filter?.column);
    const tableColumn = table[name];

    // The table object also carries functions, such as `enableRLS` and its
    // prototype members, which a truthiness check would take for columns.
    if (!is(tableColumn, Column)) {
      throw new Error(`Validation error. Unknown column '${name}'`);
    }

    let filterValue: any;

    if (jsonKey) {
      filterValue = filter.value;
    } else {
      switch (tableColumn["dataType"]) {
        case "date":
          filterValue = new Date(filter.value);
          break;
        case "boolean":
          if (typeof filter.value === "boolean") {
            filterValue = filter.value;
          } else if (typeof filter.value === "string") {
            filterValue = filter.value.toLowerCase() === "true";
          } else if (typeof filter.value === "number") {
            filterValue = filter.value === 1;
          } else {
            filterValue = Boolean(filter.value);
          }
          break;
        case "json":
          try {
            filterValue = JSON.parse(filter.value);
          } catch {
            filterValue = filter.value;
          }
          break;
        default:
          filterValue = filter.value;
      }
    }

    const comparedColumn = jsonKey
      ? jsonPathExpression(tableColumn, jsonKey)
      : tableColumn;

    if (method === "notInArray" || method === "inArray") {
      const arrayFilter: string[] = [];

      if (!filterValue) {
        resultQueries.push(queryFunctions.isNull(comparedColumn) as SQL<any>);
        continue;
      }

      if (Array.isArray(filterValue)) {
        filterValue.forEach((v) => arrayFilter.push(v));
      } else if (typeof filterValue === "object") {
        Object.values(filterValue).forEach((v: any) => arrayFilter.push(v));
      }

      resultQueries.push(
        queryFunctions[method](comparedColumn, arrayFilter) as SQL<any>,
      );
    }

    if (
      method === "eq" ||
      method === "gt" ||
      method === "lt" ||
      method === "not" ||
      method === "lte" ||
      method === "gte" ||
      method === "ne"
    ) {
      resultQueries.push(
        queryFunctions[method](comparedColumn, filterValue) as SQL<any>,
      );
    }

    if (
      method === "notIlike" ||
      method === "notLike" ||
      method === "ilike" ||
      method === "like"
    ) {
      resultQueries.push(
        queryFunctions[method](
          jsonKey ? sql`(${comparedColumn})::text` : castToText(comparedColumn),
          "%" + filterValue + "%",
        ) as SQL<any>,
      );
    }

    if (method === "isNull" || method === "isNotNull") {
      resultQueries.push(queryFunctions[method](comparedColumn) as SQL<any>);
    }
  }

  return resultQueries;
};
