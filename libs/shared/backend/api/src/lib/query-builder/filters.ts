import { SQL, getOperators } from "drizzle-orm";
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
      `You are using wrong filter type, now allowed filter types are: [${["'and'"].join(", ")}]`,
    );
  }

  const filterArrays = filters?.["and"];

  const resultQueries: (SQL<any> | undefined)[] = [];

  for (const filter of filterArrays) {
    const filterMethod: keyof QueryBuilderFilterMethods = filter?.method;
    const filterColumn: keyof T["$inferSelect"] = filter?.column;
    const tableColumn = table[filterColumn];

    let filterValue: any;

    switch (tableColumn?.["dataType"]) {
      case "date":
        filterValue = new Date(filter?.value);
        break;
      case "integer":
        filterValue = parseInt(filter?.value);
        break;
      case "boolean":
        filterValue = filter?.value === "true";
        break;
      case "json":
        filterValue = JSON.parse(filter?.value);
        break;
      default:
        filterValue = filter?.value;
    }

    if (!tableColumn) {
      throw new Error("You are missing a column in the filter object");
    }

    const method: keyof QueryBuilderFilterMethods = filterMethod;

    if (!method) {
      throw new Error("You are missing a method in the filter object");
    }

    if (method === "notInArray" || method === "inArray") {
      const arrayFilter: string[] = [];

      if (!filterValue) {
        resultQueries.push(queryFunctions.isNull(tableColumn) as SQL<any>);

        continue;
      } else if (Array.isArray(filterValue)) {
        filterValue.forEach((value) => {
          arrayFilter.push(value);
        });
      } else if (Object.keys(filterValue).length) {
        Object.values(filterValue).forEach((value: any) => {
          arrayFilter.push(value);
        });
      }

      resultQueries.push(
        queryFunctions[method](tableColumn, arrayFilter) as SQL<any>,
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
        queryFunctions[method](tableColumn, filterValue) as SQL<any>,
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
          tableColumn,
          "%" + filterValue + "%",
        ) as SQL<any>,
      );
    }

    if (
      method === "exists" ||
      method === "notExists" ||
      method === "isNull" ||
      method === "isNotNull"
    ) {
      resultQueries.push(queryFunctions[method](tableColumn));
    }

    if (
      method === "between" ||
      method === "notBetween" ||
      method === "or" ||
      method === "sql" ||
      method === "and"
    ) {
      throw new Error(`Method '${method}' not implemented`);
    }
  }

  return queryFunctions.and(...resultQueries);
};
