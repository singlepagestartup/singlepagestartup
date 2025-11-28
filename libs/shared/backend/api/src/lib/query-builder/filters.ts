import { SQL, getOperators, sql } from "drizzle-orm";
import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { validate as isUuid } from "uuid";

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

function castToText(column: any): SQL {
  return sql`CAST(${column} AS TEXT)`;
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
  const resultQueries: (SQL<any> | undefined)[] = [];

  for (const filter of filterArrays) {
    const method: keyof QueryBuilderFilterMethods = filter?.method;
    const filterColumn: keyof T["$inferSelect"] = filter?.column;
    const tableColumn = table[filterColumn];
    let filterValue: any;
    let isJsonField = false;
    const columnName = filterColumn.toString();

    if (!method) {
      throw new Error("Validation error. Missing 'method' in filter object");
    }

    if (columnName.includes("->>")) {
      isJsonField = true;
      const [column] = columnName.split("->>");
      if (!table[column.trim()]) {
        throw new Error(
          `Internal error. Column ${column.trim()} not found in table`,
        );
      }
      filterValue = filter.value;
    } else {
      if (!tableColumn) {
        throw new Error("Validation error. Missing 'column' in filter object");
      }

      switch (tableColumn["dataType"]) {
        case "date":
          filterValue = new Date(filter.value);
          break;
        case "integer":
          filterValue = parseInt(filter.value);
          break;
        case "boolean":
          filterValue = filter.value === "true";
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

    if (tableColumn && tableColumn["dataType"] === "uuid" && method === "eq") {
      if (isUuid(filter.value)) {
        resultQueries.push(
          queryFunctions.eq(tableColumn, filter.value) as SQL<any>,
        );
      } else {
        resultQueries.push(
          queryFunctions.like(
            castToText(tableColumn),
            "%" + filter.value + "%",
          ) as SQL<any>,
        );
      }
      continue;
    }

    if (method === "notInArray" || method === "inArray") {
      const arrayFilter: string[] = [];

      if (!filterValue) {
        if (isJsonField) {
          const [column, jsonField] = columnName.split("->>");
          const baseColumn = table[column.trim()];
          resultQueries.push(
            queryFunctions.isNull(
              sql`${baseColumn}->>${sql.raw(`'${jsonField.trim()}'`)}`,
            ) as SQL<any>,
          );
        } else if (tableColumn) {
          resultQueries.push(queryFunctions.isNull(tableColumn) as SQL<any>);
        }
        continue;
      }

      if (Array.isArray(filterValue)) {
        filterValue.forEach((v) => arrayFilter.push(v));
      } else if (typeof filterValue === "object") {
        Object.values(filterValue).forEach((v: any) => arrayFilter.push(v));
      }

      if (isJsonField) {
        const [column, jsonField] = columnName.split("->>");
        const baseColumn = table[column.trim()];
        resultQueries.push(
          queryFunctions[method](
            sql`${baseColumn}->>${sql.raw(`'${jsonField.trim()}'`)}`,
            arrayFilter,
          ) as SQL<any>,
        );
      } else if (tableColumn) {
        resultQueries.push(
          queryFunctions[method](tableColumn, arrayFilter) as SQL<any>,
        );
      }
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
      if (isJsonField) {
        const [column, jsonField] = columnName.split("->>");
        const baseColumn = table[column.trim()];
        resultQueries.push(
          queryFunctions[method](
            sql`${baseColumn}->>${sql.raw(`'${jsonField}'`)}`,
            filterValue,
          ) as SQL<any>,
        );
      } else if (tableColumn) {
        resultQueries.push(
          queryFunctions[method](tableColumn, filterValue) as SQL<any>,
        );
      }
    }

    if (
      method === "notIlike" ||
      method === "notLike" ||
      method === "ilike" ||
      method === "like"
    ) {
      if (isJsonField) {
        const [column, jsonField] = columnName.split("->>");
        const baseColumn = table[column.trim()];
        resultQueries.push(
          queryFunctions[method](
            sql`(${baseColumn}->>${sql.raw(`'${jsonField.trim()}'`)})::text`,
            "%" + filterValue + "%",
          ) as SQL<any>,
        );
      } else if (tableColumn) {
        resultQueries.push(
          queryFunctions[method](
            castToText(tableColumn),
            "%" + filterValue + "%",
          ) as SQL<any>,
        );
      }
    }

    if (method === "isNull" || method === "isNotNull") {
      if (isJsonField) {
        const [column, jsonField] = columnName.split("->>");
        const baseColumn = table[column.trim()];
        resultQueries.push(
          queryFunctions[method](
            sql`${baseColumn}->>${sql.raw(`'${jsonField.trim()}'`)}`,
          ) as SQL<any>,
        );
      } else if (tableColumn) {
        resultQueries.push(queryFunctions[method](tableColumn) as SQL<any>);
      }
    }
  }

  return resultQueries;
};
