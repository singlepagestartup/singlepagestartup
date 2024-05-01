// @ts-nocheck
import { HasDefault } from "drizzle-orm";
import { PgTableWithColumns, PgUUIDBuilderInitial } from "drizzle-orm/pg-core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as handlers from "../../handlers";

interface IModelFactoryParams<Schema extends Record<string, unknown>> {
  db: PostgresJsDatabase<Schema>;
  modelName: any;
  populate: {
    [key: string]: any;
  };
  Table: PgTableWithColumns<{
    name: string;
    schema: any;
    dialect: "pg";
    columns: {
      id: HasDefault<PgUUIDBuilderInitial<"id">>;
    } & any;
  }>;
  transformData: (data: any) => any;
}

export const factory = <S extends Record<string, unknown>>({
  db,
  modelName,
  Table,
  populate,
  transformData,
}: IModelFactoryParams<S>) => {
  return {
    async find() {
      const data = await handlers.find({
        db,
        modelName,
        populate,
        transformData,
      });

      return data;
    },

    async findById({ id }) {
      const data = await handlers.findById({
        id,
        db,
        modelName,
        transformData,
        Table,
        populate,
      });

      return data;
    },
    async create({ data }) {
      const entitiy = await handlers.create({
        db,
        Table,
        data,
      });

      return entitiy;
    },
    async update({ id, data }) {
      const entitiy = await handlers.update({
        id,
        db,
        Table,
        data,
      });

      return entitiy;
    },
  };
};
