// @ts-nocheck
import { HasDefault, Relations, eq } from "drizzle-orm";
import { PgTableWithColumns, PgUUIDBuilderInitial } from "drizzle-orm/pg-core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

interface IHandlerParams {
  id: string;
  db: PostgresJsDatabase<any>;
  config: any;
  Table: PgTableWithColumns<{
    name: string;
    schema: any;
    dialect: "pg";
    columns: {
      id: HasDefault<PgUUIDBuilderInitial<"id">>;
    } & any;
  }>;
  Relations: Relations<
    any,
    {
      [key: string]: any;
    }
  >;
  data: any;
}

export async function handler({ id, db, Table, config, data }: IHandlerParams) {
  // const ptl = await db
  //   .select()
  //   .from(schema.PagesToLayoutsTable)
  //   .where(
  //     eq(
  //       schema.PagesToLayoutsTable.layoutId,
  //       "0aeab32e-d5ed-4309-9a5d-6bfbceda0d35",
  //     ),
  //   );
  // console.log(`🚀 ~ handler ~ ptl:`, ptl);

  // config.table
  const sanitizedData = { ...data };

  for (const relation of Object.keys(config)) {
    if (data[relation]) {
      if (Array.isArray(data[relation])) {
        for (const relItem of data[relation]) {
          const relData = relItem;
          // console.log(`🚀 ~ handler ~ relData:`, relData.id);
          const t = config[relation].table;
          // console.log(`🚀 ~ handler ~ t:`, t);
          const val = t["layoutId"];
          const filter = eq(val, relData.id);
          // console.log(`🚀 ~ handler ~ filter:`, filter);
          // console.log(`🚀 ~ handler ~ val:`, val);

          // console.log(`🚀 ~ handler ~ relData:`, relData.id);

          const relationItems = await db.select().from(t).where(filter);

          if (!relationItems.length) {
            const newRel = await db
              .insert(t)
              .values({
                pageId: id,
                layoutId: relData.id,
              })
              .returning();

            console.log(`🚀 ~ newRel ~ newRel:`, newRel);
          }

          console.log(`🚀 ~ handler ~ relationItems:`, relationItems);
        }
      }

      delete sanitizedData[relation];
    }
  }
  // const relationsTableConfig = getTableConfig(Table);
  // console.log(`🚀 ~ relationsTableConfig:`, relationsTableConfig);

  // console.log(`🚀 ~ Relations:`, Relations);
  // console.log(`🚀 ~ config:`, config);
  console.log(`🚀 ~ handler ~ data:`, sanitizedData);

  const entities = await db
    .update(Table)
    .set(sanitizedData)
    .where(eq(Table["id"], id))
    .returning();

  return entities[0];
}
