import "reflect-metadata";
import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { inject, injectable } from "inversify";
import { postgres } from "@sps/shared-backend-database-config";
import * as methods from "drizzle-orm";
import { FindServiceProps } from "../../services/interfaces";
import { queryBuilder } from "../../query-builder";
import { DI } from "../../di/constants";
import { type IRepository } from "../interface";
import {
  IDumpResult,
  ISeedResult,
  type IConfiguration,
} from "../../configuration";
import { ZodDate, ZodError, ZodObject } from "zod";
import fs from "fs/promises";

@injectable()
export class Database<T extends PgTableWithColumns<any>>
  implements IRepository
{
  db: PostgresJsDatabase<any>;
  Table: T;
  insertSchema: ZodObject<any>;
  selectSchema: ZodObject<any>;
  configuration: ReturnType<IConfiguration["getConfiguration"]>;

  constructor(@inject(DI.IConfiguration) configuration: IConfiguration) {
    const config = configuration.getConfiguration();

    this.Table = config.repository.Table;
    this.db = drizzle(postgres, {
      schema: config.repository.Table,
    });
    this.insertSchema = config.repository.insertSchema;
    this.selectSchema = config.repository.selectSchema;
    this.configuration = config;
  }

  async find(props?: FindServiceProps): Promise<T["$inferSelect"][]> {
    try {
      const filters = queryBuilder.filters({
        table: this.Table,
        filters: props?.params?.filters,
        queryFunctions: methods,
      });

      if (props?.params?.orderBy?.and && !props.params.orderBy.and?.[0]) {
        throw new Error(
          "You need to pass an orderBy array with column and method",
        );
      }

      const order =
        props?.params?.orderBy?.and?.length &&
        props.params.orderBy.and[0].method
          ? methods[props.params.orderBy.and[0].method as any](
              this.Table[props.params.orderBy.and[0].column],
            )
          : "orderIndex" in this.Table
            ? methods.asc(this.Table.orderIndex)
            : null;

      const records = await this.db
        .select()
        .from(this.Table)
        .where(filters)
        .limit(props?.params?.limit as number)
        .orderBy(order)
        .execute();

      const sanitizedRecords = records.map((record) => {
        const sanitizedRecord = this.selectSchema.parse(record);
        return sanitizedRecord;
      });

      return sanitizedRecords;
    } catch (error: any) {
      console.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async findByField(field: string, value: any): Promise<any> {
    try {
      if (!this.Table[field]) {
        throw new Error(`Field ${field} does not exist on table ${this.Table}`);
      }

      const records = await this.db
        .select()
        .from(this.Table)
        .where(methods.eq(this.Table[field], value))
        .execute();

      const sanitizedRecords = records.map((record) => {
        const sanitizedRecord = this.selectSchema.parse(record);
        return sanitizedRecord;
      });

      return sanitizedRecords;
    } catch (error: any) {
      console.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async findFirstByField(field: string, value: any): Promise<any> {
    try {
      const [record] = await this.findByField(field, value);

      const sanitizedRecord = this.selectSchema.parse(record);

      return sanitizedRecord;
    } catch (error: any) {
      console.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async insert(data: any): Promise<T["$inferInsert"]> {
    try {
      const shape = this.insertSchema.shape;

      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;

      Object.entries(shape).forEach(([key, value]) => {
        if (value instanceof ZodDate && data[key]) {
          data[key] = new Date(data[key]);
        }

        if (["updatedAt", "createdAt"].includes(key)) {
          data[key] = new Date();
        }
      });

      const plainData: T["$inferInsert"] = this.insertSchema.parse(data);

      const [record] = await this.db
        .insert(this.Table)
        .values(plainData)
        .returning()
        .execute();

      const sanitizedRecord = this.selectSchema.parse(record);

      return sanitizedRecord;
    } catch (error: any) {
      console.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async deleteFirstByField(field: string, value: any): Promise<any> {
    try {
      if (!this.Table[field]) {
        throw new Error(`Field ${field} does not exist on table ${this.Table}`);
      }

      const [record] = await this.findByField(field, value);

      if (record) {
        const [result] = await this.db
          .delete(this.Table)
          .where(methods.eq(this.Table[field], record[field]))
          .returning()
          .execute();

        if (result) {
          const sanitizedRecord = this.selectSchema.parse(result);

          return sanitizedRecord;
        }
      }
    } catch (error: any) {
      console.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async updateFirstByField(field: string, value: any, data: any): Promise<any> {
    try {
      if (!this.Table[field]) {
        throw new Error(`Field ${field} does not exist on table ${this.Table}`);
      }

      const [record] = await this.findByField(field, value);

      const shape = this.insertSchema.shape;

      Object.entries(shape).forEach(([key, value]) => {
        if (value instanceof ZodDate && data[key]) {
          data[key] = new Date(data[key]);
        }

        if (key === "updatedAt" && value instanceof ZodDate) {
          data[key] = new Date();
        }
      });

      delete data.createdAt;
      data.updatedAt = new Date();

      const plainData: T["$inferInsert"] = this.insertSchema.parse(data);

      const [result] = await this.db
        .update(this.Table)
        .set(plainData)
        .where(methods.eq(this.Table[field], record[field]))
        .returning()
        .execute();

      const sanitizedRecord = this.selectSchema.parse(result);

      return sanitizedRecord;
    } catch (error: any) {
      console.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async dump(): Promise<IDumpResult> {
    const result: IDumpResult = {
      module: this.configuration.repository.seed.module,
      name: this.configuration.repository.seed.name,
      type: this.configuration.repository.seed.type as "model" | "relation",
      dumps: [],
    };

    if (!this.configuration.repository.dump.active) {
      return result;
    }

    const entities = await this.find();

    const directory = this.configuration.repository.dump.directory;

    const seedFiles = await fs.readdir(directory);

    const sanitizedFiles = seedFiles.filter((file) => file.endsWith(".json"));

    for (const sanitizedFile of sanitizedFiles) {
      await fs.unlink(`${directory}/${sanitizedFile}`);
    }

    for (const entity of entities) {
      const fileContent = JSON.stringify(entity, null, 2);

      await fs.writeFile(`${directory}/${entity.id}.json`, fileContent);
    }

    result.dumps = entities;

    return result;
  }

  async seed(props?: { seeds: ISeedResult[] }): Promise<ISeedResult> {
    const result: ISeedResult = {
      module: this.configuration.repository.seed.module,
      name: this.configuration.repository.seed.name,
      type: this.configuration.repository.seed.type as "model" | "relation",
      seeds: [],
    };

    if (!this.configuration.repository.seed.active) {
      return result;
    }

    const directory = this.configuration.repository.dump.directory;

    const getDumpEntities = async (): Promise<T["$inferSelect"][]> => {
      const entities: T["$inferSelect"][] = [];

      const seedFiles = await fs.readdir(directory);

      const sanitizedFiles = seedFiles.filter((file) => file.endsWith(".json"));

      for (const sanitizedFile of sanitizedFiles) {
        const seed = await fs.readFile(`${directory}/${sanitizedFile}`, {
          encoding: "utf-8",
        });

        const parsedSeedFile = JSON.parse(seed);

        entities.push(parsedSeedFile as T["$inferSelect"]);
      }

      return entities;
    };

    const dumpEntities = await getDumpEntities();
    const dbEntities = await this.find();

    if (dbEntities.length) {
      if (!this.configuration.repository.seed.filters) {
        for (const dbEntity of dbEntities) {
          await this.deleteFirstByField("id", dbEntity.id);
        }
      }
    }

    const insertedEntities: ISeedResult["seeds"] = [];

    for (const dumpEntity of dumpEntities) {
      const transformers = this.configuration.repository.seed.transformers;

      let transformedEntity: T["$inferInsert"] = { ...dumpEntity };

      if (transformers) {
        for (const transformer of transformers) {
          const { field, transform } = transformer;

          if (!props?.seeds) {
            throw new Error("You need to pass seeds to compare");
          }

          const transformedValue = transform({
            seeds: props.seeds,
            entity: {
              dump: dumpEntity,
            },
          });

          if (transformedValue) {
            transformedEntity = {
              ...transformedEntity,
              [field]: transformedValue,
            };
          }
        }
      }

      const filledFilters = this.configuration.repository.seed.filters?.map(
        (filter) => {
          return {
            column: filter.column,
            method: filter.method,
            value: filter.value({
              seeds: props?.seeds || [],
              entity: {
                dump: dumpEntity,
                db: dbEntities,
              },
            }),
          };
        },
      );

      if (filledFilters) {
        const filteredEntities = await this.find({
          params: {
            filters: {
              and: filledFilters,
            },
          },
        });

        if (filteredEntities.length) {
          if (filteredEntities.length > 1) {
            throw new Error(
              "You need to pass a filter that returns more than one entity",
            );
          }

          for (const filteredEntity of filteredEntities) {
            delete transformedEntity.id;

            const updatedEntity = await this.updateFirstByField(
              "id",
              filteredEntity.id,
              transformedEntity,
            );

            const seedResult = {
              new: updatedEntity,
              old: filteredEntity,
              dump: dumpEntity,
            };
            insertedEntities.push(seedResult);
          }
        }
      } else {
        const insertedEntity = await this.insert(transformedEntity);
        const seedResult = {
          new: insertedEntity,
          dump: dumpEntity,
        };
        insertedEntities.push(seedResult);
      }
    }

    result.seeds = insertedEntities;

    return result;
  }
}
