import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { IModuleSeedConfig } from "./actions/seed/Seeder";
import { ZodObject } from "zod";

export interface IService {
  find: (props: {
    db: PostgresJsDatabase<any>;
    schemaName: keyof typeof props.db._.fullSchema;
  }) => Promise<any>;
  findById: (props: {
    id: string;
    db: PostgresJsDatabase<any>;
    Table: PgTableWithColumns<any>;
    schemaName: keyof typeof props.db._.fullSchema;
  }) => Promise<any>;
  create: (props: {
    data: any;
    db: PostgresJsDatabase<any>;
    insertSchema: ZodObject<any, any>;
    Table: PgTableWithColumns<any>;
    schemaName: keyof typeof props.db._.fullSchema;
  }) => Promise<any>;
  update: (props: {
    id: string;
    data: any;
    db: PostgresJsDatabase<any>;
    insertSchema: ZodObject<any, any>;
    Table: PgTableWithColumns<any>;
    schemaName: keyof typeof props.db._.fullSchema;
  }) => Promise<any>;
  delete: (props: {
    id: string;
    db: PostgresJsDatabase<any>;
    Table: PgTableWithColumns<any>;
    schemaName: keyof typeof props.db._.fullSchema;
  }) => Promise<any>;
  dump: (props: {
    db: PostgresJsDatabase<any>;
    schemaName: keyof typeof props.db._.fullSchema;
    Table: PgTableWithColumns<any>;
    seedsPath?: string;
  }) => Promise<any>;
  seed: (props: {
    db: PostgresJsDatabase<any>;
    schemaName: keyof typeof props.db._.fullSchema;
    Table: PgTableWithColumns<any>;
    seedsPath?: string;
    insertSchema: ZodObject<any, any>;
    seedResults?: any;
    seedConfig: {
      [key: string]: IModuleSeedConfig<any>;
    };
  }) => Promise<any>;
}
