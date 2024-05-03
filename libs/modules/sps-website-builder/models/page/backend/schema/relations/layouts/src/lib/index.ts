import {
  Table,
  populate as pagesToLayoutsPopulate,
} from "@sps/sps-website-builder-backend-schema-relations-pages-to-layouts";
import { transformManyToManyRelations } from "@sps/shared-backend-database-config";
import { TableRelationsHelpers } from "drizzle-orm";

const name = "layouts";
const type = "many" as const;
const constantName = "PagesToLayouts";
// const n = Table.layoutId.
// console.log(`🚀 ~ n:`, n);

export const relationAliases = {
  [constantName]: {
    schemaKey: "layout",
    toDataKey: name,
  },
};

export const relation = <TTableName extends string>(
  helpers: TableRelationsHelpers<TTableName>,
) => {
  return {
    [constantName]: helpers.many(Table),
  };
};

export const populate = {
  [constantName]: {
    with: pagesToLayoutsPopulate,
  },
};

export function transformData({ data }: any) {
  const transformedData = transformManyToManyRelations({
    data,
    relationAliases,
  });

  return transformedData;
}

export const config = {
  name,
  type,
  table: Table,
  leftKey: "pageId",
  rightKey: "layoutId",
};
