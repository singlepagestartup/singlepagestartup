import { logger } from "@sps/backend-utils";
import { getDrizzle } from "@sps/shared-backend-database-config";
import * as methods from "drizzle-orm";
import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import fs from "fs/promises";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import { ZodDate, ZodError, ZodNullable, ZodObject, ZodOptional } from "zod";
import {
  IDumpResult,
  ISeedResult,
  type IConfiguration,
} from "../../configuration";
import { DI } from "../../di/constants";
import { queryBuilder } from "../../query-builder";
import { type IFilter } from "../../query-builder/filters";
import { FindServiceProps } from "../../services/interfaces";
import { type IRepository } from "../interface";

/**
 * Sort directions `find` accepts in `orderBy.and[].method`. The method names
 * the `drizzle-orm` export that is called with the sort column, so no other
 * name may reach that lookup.
 */
export const ALLOWED_ORDER_BY_METHODS = Object.freeze(["asc", "desc"] as const);

export type IAllowedOrderByMethod = (typeof ALLOWED_ORDER_BY_METHODS)[number];

/**
 * A plain column identifier. Unlike a filter column, a sort column takes no
 * json key.
 */
const ORDER_BY_COLUMN_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isDateSchema(value: unknown): boolean {
  if (value instanceof ZodDate) {
    return true;
  }

  if (value instanceof ZodOptional || value instanceof ZodNullable) {
    return isDateSchema(value._def.innerType);
  }

  return false;
}

function parseOrderByMethod(method: unknown): IAllowedOrderByMethod {
  if (
    typeof method !== "string" ||
    !ALLOWED_ORDER_BY_METHODS.includes(method as IAllowedOrderByMethod)
  ) {
    throw new Error(`Validation error. Unknown orderBy method '${method}'`);
  }

  return method as IAllowedOrderByMethod;
}

function parseOrderByColumn(column: unknown): string {
  if (typeof column !== "string" || !ORDER_BY_COLUMN_PATTERN.test(column)) {
    throw new Error("Validation error. OrderBy column must be an identifier");
  }

  return column;
}

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

    this.db = getDrizzle({ ...this.Table });
    this.insertSchema = config.repository.insertSchema;
    this.selectSchema = config.repository.selectSchema;
    this.configuration = config;
  }

  async find(props?: FindServiceProps): Promise<T["$inferSelect"][]> {
    try {
      const filters = queryBuilder.filters({
        table: this.Table as T,
        queryFunctions: methods,
        filters: props?.params?.filters,
      });

      const order = this.prepareOrderBy(props?.params?.orderBy);

      const records = await this.db
        .select()
        .from(this.Table)
        .where(filters ? methods.and(...filters) : undefined)
        .limit(Number(props?.params?.limit) as number)
        .offset(Number(props?.params?.offset) as number)
        .orderBy(...order)
        .execute();

      const sanitizedRecords = records.map((record) => {
        const sanitizedRecord = this.selectSchema.parse(record);
        return sanitizedRecord;
      });

      return sanitizedRecords;
    } catch (error: any) {
      logger.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async count(props?: FindServiceProps): Promise<number> {
    try {
      const filters = queryBuilder.filters({
        table: this.Table as T,
        queryFunctions: methods,
        filters: props?.params?.filters,
      });

      const [record] = await this.db
        .select({ count: methods.count() })
        .from(this.Table)
        .where(filters ? methods.and(...filters) : undefined)
        .execute();

      return Number(record?.count ?? 0);
    } catch (error: any) {
      logger.error(error);

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
      logger.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  async findFirstByField(field: string, value: any): Promise<any> {
    try {
      const [record] = await this.findByField(field, value);

      return record;
    } catch (error: any) {
      logger.error(error);

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

      Object.entries(shape).forEach(([key, value]) => {
        if (isDateSchema(value) && typeof data[key] === "string") {
          data[key] = new Date(data[key]);
        }

        if (
          [
            "expiresAt",
            "date",
            "datetime",
            "sendAfter",
            "updatedAt",
            "createdAt",
          ].includes(key) &&
          typeof data[key] === "string"
        ) {
          data[key] = new Date(data[key]);
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
      logger.error(error);

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

      const plainData: T["$inferInsert"] = this.insertSchema.parse(
        this.prepareWritableData(data),
      );

      const [result] = await this.db
        .update(this.Table)
        .set(plainData)
        .where(methods.eq(this.Table[field], record[field]))
        .returning()
        .execute();

      const sanitizedRecord = this.selectSchema.parse(result);

      return sanitizedRecord;
    } catch (error: any) {
      logger.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  /**
   * Single-use write: the predicate is part of the `update ... where`, so the
   * row is claimed by the write itself instead of by a read that precedes it.
   * Two concurrent callers can therefore never both observe the row as
   * unclaimed. `undefined` means no row matched, which is how a caller learns
   * it lost the race or the row was already consumed.
   *
   * `data` is a patch, not a full row, so it is parsed against the partial
   * insert schema.
   */
  async consumeFirstByField(
    field: string,
    value: any,
    data: any,
    predicate?: { and: IFilter[] },
  ): Promise<any> {
    try {
      if (!this.Table[field]) {
        throw new Error(`Field ${field} does not exist on table ${this.Table}`);
      }

      const predicates = queryBuilder.filters({
        table: this.Table as T,
        queryFunctions: methods,
        filters: predicate,
      });

      const plainData: Partial<T["$inferInsert"]> = this.insertSchema
        .partial()
        .parse(this.prepareWritableData(data));

      const [result] = await this.db
        .update(this.Table)
        .set(plainData)
        .where(
          methods.and(
            methods.eq(this.Table[field], value),
            ...(predicates || []),
          ),
        )
        .returning()
        .execute();

      if (!result) {
        return undefined;
      }

      const sanitizedRecord = this.selectSchema.parse(result);

      return sanitizedRecord;
    } catch (error: any) {
      logger.error(error);

      if (error instanceof ZodError) {
        throw new Error(JSON.stringify({ zodError: error.issues }));
      }

      throw error;
    }
  }

  /**
   * The sort `find` applies. Every item of `orderBy.and` needs an allowed
   * direction and a column of this table, and the first item is the one
   * applied. Without a sort, a table with `orderIndex` is read in that order.
   */
  protected prepareOrderBy(
    orderBy?: NonNullable<FindServiceProps["params"]>["orderBy"],
  ): methods.SQL[] {
    if (!orderBy?.and) {
      return "orderIndex" in this.Table
        ? [methods.asc(this.Table.orderIndex)]
        : [];
    }

    if (!Array.isArray(orderBy.and)) {
      throw new Error("Validation error. 'orderBy.and' must be an array");
    }

    if (
      !orderBy.and.length ||
      !orderBy.and.every((item) => item?.column && item?.method)
    ) {
      throw new Error(
        "Validation error. You need to pass an orderBy array with 'column' and 'method' for each item",
      );
    }

    const order = orderBy.and.map((item) => {
      const method = parseOrderByMethod(item.method);
      const column = parseOrderByColumn(item.column);
      const tableColumn = this.Table[column];

      // The table object also carries functions, such as `enableRLS` and its
      // prototype members, which a truthiness check would take for columns.
      if (!methods.is(tableColumn, methods.Column)) {
        throw new Error(`Validation error. Unknown column '${column}'`);
      }

      return methods[method](tableColumn);
    });

    return order.slice(0, 1);
  }

  protected prepareWritableData(data: any) {
    const shape = this.insertSchema.shape;

    Object.entries(shape).forEach(([key, schema]) => {
      if (isDateSchema(schema) && typeof data[key] === "string") {
        data[key] = new Date(data[key]);
      }

      if (
        [
          "expiresAt",
          "date",
          "datetime",
          "sendAfter",
          "createdAt",
          "updatedAt",
        ].includes(key) &&
        typeof data[key] === "string"
      ) {
        data[key] = new Date(data[key]);
      }
    });

    if (!data.updatedAt) {
      data.updatedAt = new Date();
    }

    return data;
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

    console.log(
      "Seeding. Module:",
      this.configuration.repository.seed.module,
      "Name:",
      this.configuration.repository.seed.name,
    );

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

      /**
       * For temporary purposes, old projects doesn't have slug in widgets, that throws error
       * Slug will be required for widgets and website-builder models
       */
      if (filledFilters && filledFilters.every((f) => f.value)) {
        const filteredEntities = await this.find({
          params: {
            filters: {
              and: filledFilters,
            },
          },
        });

        if (filteredEntities.length) {
          for (const filteredEntity of filteredEntities) {
            if (
              filteredEntity.updatedAt &&
              new Date(filteredEntity.updatedAt) >
                new Date(transformedEntity.updatedAt)
            ) {
              const seedResult = {
                new: filteredEntity,
                old: filteredEntity,
                dump: dumpEntity,
              };

              insertedEntities.push(seedResult);

              continue;
            }

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
        } else {
          const insertedEntity = await this.insert(transformedEntity);
          const seedResult = {
            new: insertedEntity,
            dump: dumpEntity,
          };
          insertedEntities.push(seedResult);
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
