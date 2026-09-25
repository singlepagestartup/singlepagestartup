/**
 * BDD Suite: Database.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { Container } from "inversify";
import {
  Configuration,
  IConfiguration,
  ISeedResult,
} from "../../configuration";
import { DI } from "../../di/constants";
import { Database } from ".";
import { IRepository } from "../interface";
import fs from "fs/promises";
import {
  PgDialect,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod";

const CountTestTable = pgTable("count_test", {
  id: text("id"),
  status: text("status"),
  orderIndex: integer("order_index"),
});

const SortTestTable = pgTable("sort_test", {
  id: text("id"),
  status: text("status"),
  orderIndex: integer("order_index"),
});

const UnorderedTestTable = pgTable("unordered_test", {
  id: text("id"),
  status: text("status"),
});

const dialect = new PgDialect();

const ConsumeTestTable = pgTable("consume_test", {
  id: text("id"),
  consumedAt: timestamp("consumed_at"),
});

const baseConfiguration: IConfiguration["repository"] = {
  type: "database",
  Table: {} as any,
  selectSchema: {} as any,
  insertSchema: {} as any,
  dump: {
    active: true,
    directory: "test",
    type: "json",
  },
  seed: {
    active: true,
    module: "website-builder",
    name: "widget",
    type: "model",
  },
};

describe("Database", () => {
  describe("find", () => {
    function createFindRepository(Table: any = SortTestTable) {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          Table,
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);
      const execute = jest.fn().mockResolvedValue([]);
      const orderBy = jest.fn().mockReturnValue({ execute });
      const offset = jest.fn().mockReturnValue({ orderBy });
      const limit = jest.fn().mockReturnValue({ offset });
      const where = jest.fn().mockReturnValue({ limit });
      const from = jest.fn().mockReturnValue({ where });
      const select = jest.fn().mockReturnValue({ from });

      (repository as any).db = { select };

      return { repository, select, orderBy };
    }

    function renderedOrder(orderBy: jest.Mock) {
      return orderBy.mock.calls[0].map(
        (expression: any) => dialect.sqlToQuery(expression).sql,
      );
    }

    /**
     * BDD Scenario: a sort in an allowed direction.
     *
     * Given: a repository over a table with an orderIndex column.
     * When: find is called with a sort on that column in an allowed direction.
     * Then: the query is ordered by the column in that direction.
     */
    it.each(["asc", "desc"] as const)(
      "orders the query by the column in the %s direction",
      async (method) => {
        const { repository, orderBy } = createFindRepository();

        await repository.find({
          params: { orderBy: { and: [{ column: "orderIndex", method }] } },
        });

        expect(renderedOrder(orderBy)).toEqual([
          `"sort_test"."order_index" ${method}`,
        ]);
      },
    );

    /**
     * BDD Scenario: a sort method outside the allow-list.
     *
     * Given: a sort whose method names another drizzle-orm export, an object
     * prototype member or an upper-case direction.
     * When: find is called with it.
     * Then: it refuses with a validation error before any query is built.
     */
    it.each(["sql", "count", "constructor", "ASC"])(
      "refuses the sort method '%s'",
      async (method) => {
        const { repository, select } = createFindRepository();

        await expect(
          repository.find({
            params: {
              orderBy: {
                and: [{ column: "orderIndex", method: method as any }],
              },
            },
          }),
        ).rejects.toThrow(
          `Validation error. Unknown orderBy method '${method}'`,
        );
        expect(select).not.toHaveBeenCalled();
      },
    );

    /**
     * BDD Scenario: a sort column the table does not have.
     *
     * Given: a sort whose column is absent from the table, an object prototype
     * member or a function the drizzle table carries.
     * When: find is called with it.
     * Then: it refuses with a validation error naming the column.
     */
    it.each(["missing", "constructor", "enableRLS"])(
      "refuses the sort column '%s'",
      async (column) => {
        const { repository, select } = createFindRepository();

        await expect(
          repository.find({
            params: { orderBy: { and: [{ column, method: "asc" }] } },
          }),
        ).rejects.toThrow(`Validation error. Unknown column '${column}'`);
        expect(select).not.toHaveBeenCalled();
      },
    );

    /**
     * BDD Scenario: a sort column that is not an identifier.
     *
     * Given: a sort column carrying a direction or a json key.
     * When: find is called with it.
     * Then: it refuses with a validation error.
     */
    it.each(["orderIndex desc", "status->>en"])(
      "refuses the sort column '%s' that is not an identifier",
      async (column) => {
        const { repository } = createFindRepository();

        await expect(
          repository.find({
            params: { orderBy: { and: [{ column, method: "asc" }] } },
          }),
        ).rejects.toThrow(
          "Validation error. OrderBy column must be an identifier",
        );
      },
    );

    /**
     * BDD Scenario: several sort items.
     *
     * Given: a sort with two items.
     * When: find is called with both valid, then with an invalid second item.
     * Then: only the first item orders the query, and an invalid second item
     * refuses the request although it is not applied.
     */
    it("validates every sort item and applies the first", async () => {
      const valid = createFindRepository();

      await valid.repository.find({
        params: {
          orderBy: {
            and: [
              { column: "orderIndex", method: "desc" },
              { column: "status", method: "asc" },
            ],
          },
        },
      });

      expect(renderedOrder(valid.orderBy)).toEqual([
        '"sort_test"."order_index" desc',
      ]);

      const invalid = createFindRepository();

      await expect(
        invalid.repository.find({
          params: {
            orderBy: {
              and: [
                { column: "orderIndex", method: "desc" },
                { column: "status", method: "sql" as any },
              ],
            },
          },
        }),
      ).rejects.toThrow("Validation error. Unknown orderBy method 'sql'");
      expect(invalid.select).not.toHaveBeenCalled();
    });

    /**
     * BDD Scenario: a malformed sort group.
     *
     * Given: a sort group that is a string, an empty array or an item without a method.
     * When: find is called with it.
     * Then: it refuses with a validation error instead of a TypeError.
     */
    it("refuses a sort group that is not a list of complete items", async () => {
      const { repository } = createFindRepository();

      await expect(
        repository.find({ params: { orderBy: { and: "orderIndex" as any } } }),
      ).rejects.toThrow("Validation error. 'orderBy.and' must be an array");
      await expect(
        repository.find({ params: { orderBy: { and: [] } } }),
      ).rejects.toThrow(
        "Validation error. You need to pass an orderBy array with 'column' and 'method' for each item",
      );
      await expect(
        repository.find({
          params: { orderBy: { and: [{ column: "orderIndex" } as any] } },
        }),
      ).rejects.toThrow(
        "Validation error. You need to pass an orderBy array with 'column' and 'method' for each item",
      );
    });

    /**
     * BDD Scenario: no sort requested.
     *
     * Given: one table with an orderIndex column and one without.
     * When: find is called without a sort.
     * Then: the first is read in orderIndex order and the second unordered.
     */
    it("reads by orderIndex when no sort is requested", async () => {
      const ordered = createFindRepository(SortTestTable);
      const unordered = createFindRepository(UnorderedTestTable);

      await ordered.repository.find();
      await unordered.repository.find({ params: { limit: 10 } });

      expect(renderedOrder(ordered.orderBy)).toEqual([
        '"sort_test"."order_index" asc',
      ]);
      expect(unordered.orderBy).toHaveBeenCalledWith();
    });
  });

  describe("count", () => {
    /**
     * BDD Scenario: unfiltered repository count.
     *
     * Given: a database repository with a mocked aggregate query chain.
     * When: count is requested without filters.
     * Then: the repository returns the numeric aggregate and does not require pagination or sorting.
     */
    it("returns numeric aggregate for unfiltered count", async () => {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          Table: CountTestTable,
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);
      const execute = jest.fn().mockResolvedValue([{ count: "7" }]);
      const where = jest.fn().mockReturnValue({ execute });
      const from = jest.fn().mockReturnValue({ where });
      const select = jest.fn().mockReturnValue({ from });

      (repository as any).db = { select };

      const result = await repository.count({
        params: {
          limit: 1,
          offset: 2,
          orderBy: {
            and: [
              {
                column: "orderIndex",
                method: "desc",
              },
            ],
          },
        },
      });

      expect(result).toBe(7);
      expect(select).toHaveBeenCalledWith({ count: expect.anything() });
      expect(from).toHaveBeenCalledWith(CountTestTable);
      expect(where).toHaveBeenCalledWith(undefined);
      expect(execute).toHaveBeenCalledTimes(1);
    });

    /**
     * BDD Scenario: filtered repository count.
     *
     * Given: a database repository with shared filter params.
     * When: count is requested with filters.and.
     * Then: the repository applies the shared predicate builder and returns the filtered aggregate.
     */
    it("applies filters.and when counting records", async () => {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          Table: CountTestTable,
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);
      const execute = jest.fn().mockResolvedValue([{ count: 3 }]);
      const where = jest.fn().mockReturnValue({ execute });
      const from = jest.fn().mockReturnValue({ where });
      const select = jest.fn().mockReturnValue({ from });

      (repository as any).db = { select };

      const result = await repository.count({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "eq",
                value: "active",
              },
            ],
          },
          limit: 1,
          offset: 2,
        },
      });

      expect(result).toBe(3);
      expect(where).toHaveBeenCalledWith(expect.anything());
      expect(execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("insert", () => {
    /**
     * BDD Scenario: nullable timestamp fields arrive from JSON clients.
     *
     * Given: a repository insert schema has a nullable optional date field.
     * When: insert receives that date as an ISO string from a JSON request.
     * Then: the database layer coerces the value before zod parsing.
     */
    it("coerces nullable optional date strings before insert parsing", async () => {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          insertSchema: z.object({
            id: z.string().optional(),
            finishedAt: z.date().nullable().optional(),
          }),
          selectSchema: z.object({
            id: z.string(),
            finishedAt: z.date().nullable().optional(),
          }),
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);
      const insertedRows: any[] = [];

      (repository as any).db = {
        insert: () => ({
          values: (data: any) => {
            insertedRows.push(data);

            return {
              returning: () => ({
                execute: async () => [{ ...data, id: "run-1" }],
              }),
            };
          },
        }),
      };

      const result = await repository.insert({
        id: "client-id",
        finishedAt: "2026-05-20T00:00:00.000Z",
      });

      expect(insertedRows[0].finishedAt).toBeInstanceOf(Date);
      expect(result.finishedAt).toBeInstanceOf(Date);
    });
  });

  describe("consumeFirstByField", () => {
    function createConsumeRepository() {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          Table: ConsumeTestTable,
          insertSchema: z.object({
            id: z.string().optional(),
            consumedAt: z.date().nullable().optional(),
          }),
          selectSchema: z.object({
            id: z.string(),
            consumedAt: z.date().nullable().optional(),
          }),
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);
      const execute = jest.fn();
      const returning = jest.fn().mockReturnValue({ execute });
      const where = jest.fn().mockReturnValue({ returning });
      const set = jest.fn().mockReturnValue({ where });
      const update = jest.fn().mockReturnValue({ set });
      const select = jest.fn();

      (repository as any).db = { update, select };

      return { repository, execute, where, set, update, select };
    }

    const notConsumedYet = {
      and: [
        {
          column: "consumedAt",
          method: "isNull" as const,
          value: undefined,
        },
      ],
    };

    /**
     * BDD Scenario: conditional consume returns nothing when the predicate no longer holds.
     *
     * Given: a row whose consumedAt is already set.
     * When: consumeFirstByField runs with a "not yet consumed" predicate.
     * Then: no row is returned and the stored row is unchanged.
     */
    it("returns nothing when the predicate no longer holds", async () => {
      const { repository, execute, update } = createConsumeRepository();

      execute.mockResolvedValue([]);

      const result = await repository.consumeFirstByField(
        "id",
        "row-1",
        { consumedAt: new Date() },
        notConsumedYet,
      );

      expect(result).toBeUndefined();
      expect(update).toHaveBeenCalledTimes(1);
    });

    /**
     * BDD Scenario: the claim is one write, not a read followed by a write.
     *
     * Given: a repository row and a predicate that still holds.
     * When: consumeFirstByField claims it.
     * Then: the row comes back, the predicate travelled with the update, and no
     * select preceded it.
     */
    it("claims the row in a single conditional write", async () => {
      const { repository, execute, where, set, select } =
        createConsumeRepository();

      execute.mockResolvedValue([{ id: "row-1", consumedAt: new Date() }]);

      const result = await repository.consumeFirstByField(
        "id",
        "row-1",
        { consumedAt: new Date() },
        notConsumedYet,
      );

      expect(result?.id).toBe("row-1");
      expect(select).not.toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith(expect.anything());
      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({ consumedAt: expect.any(Date) }),
      );
    });

    /**
     * BDD Scenario: a patch rather than a whole row.
     *
     * Given: the caller passes only the fields it wants changed.
     * When: consumeFirstByField parses them.
     * Then: the partial insert schema accepts the patch and stamps updatedAt.
     */
    it("accepts a partial patch and coerces its date strings", async () => {
      const { repository, execute, set } = createConsumeRepository();

      execute.mockResolvedValue([{ id: "row-1", consumedAt: new Date() }]);

      await repository.consumeFirstByField(
        "id",
        "row-1",
        { consumedAt: "2026-05-20T00:00:00.000Z" },
        notConsumedYet,
      );

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({ consumedAt: expect.any(Date) }),
      );
    });

    /**
     * BDD Scenario: a field the table does not have.
     *
     * Given: the caller names a column that is not on the table.
     * When: consumeFirstByField runs.
     * Then: it refuses before issuing any write.
     */
    it("refuses a field the table does not have", async () => {
      const { repository, update } = createConsumeRepository();

      await expect(
        repository.consumeFirstByField("missing", "row-1", {}, notConsumedYet),
      ).rejects.toThrow("Field missing does not exist");
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe("dump", () => {
    it("should create files in config.repository.directory", async () => {
      const configuration = new Configuration({
        repository: baseConfiguration,
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);

      const spys = [
        jest.spyOn(fs, "readdir").mockResolvedValueOnce(["1.json"] as any),
        jest.spyOn(fs, "unlink").mockResolvedValueOnce(undefined as any),
        jest.spyOn(fs, "writeFile").mockResolvedValueOnce(undefined as any),
      ];

      const repositoryEntity = {
        id: 2,
      };

      repository.find = jest.fn().mockReturnValueOnce([repositoryEntity]);

      const dumpResult = await repository.dump();

      expect(fs.unlink).toHaveBeenCalledWith("test/1.json");
      expect(fs.writeFile).toHaveBeenCalledWith(
        "test/2.json",
        JSON.stringify(repositoryEntity, null, 2),
      );
      expect(dumpResult).toEqual({
        dumps: [repositoryEntity],
        module: "website-builder",
        name: "widget",
        type: "model",
      });
      spys.forEach((spy) => spy.mockClear());
    });
    it("should not create files in config.repository.directory if passed seed=false", async () => {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          dump: {
            ...baseConfiguration.dump,
            active: false,
          },
        },
      });

      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);

      const spys = [
        jest.spyOn(fs, "readdir").mockResolvedValueOnce(["1.json"] as any),
        jest.spyOn(fs, "unlink").mockResolvedValueOnce(undefined as any),
        jest.spyOn(fs, "writeFile").mockResolvedValueOnce(undefined as any),
      ];

      const repositoryEntity = {
        id: 2,
      };

      repository.find = jest.fn().mockReturnValueOnce([repositoryEntity]);

      const dumpResult = await repository.dump();

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
      expect(dumpResult).toEqual({
        dumps: [],
        module: "website-builder",
        name: "widget",
        type: "model",
      });
      spys.forEach((spy) => spy.mockClear());
    });
  });

  describe("seed", () => {
    /**
     * BDD Scenario: inactive runtime repositories are excluded from seeding.
     *
     * Given: a repository whose seed configuration is inactive.
     * When: the generic seed operation is invoked.
     * Then: it neither reads snapshot files nor announces an active seed operation.
     */
    it("should not create entities from files in config.repository.directory if passed active=false", async () => {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          seed: {
            ...baseConfiguration.seed,
            active: false,
          },
        },
      });

      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);

      const spys = [
        jest.spyOn(console, "log").mockImplementation(() => undefined),
        jest.spyOn(fs, "readdir"),
        jest.spyOn(fs, "readFile"),
        jest.spyOn(repository, "find").mockResolvedValueOnce([]),
        jest.spyOn(repository, "find").mockResolvedValueOnce([]),
        jest.spyOn(repository, "insert"),
        jest.spyOn(repository, "deleteFirstByField"),
      ];

      const expectedResult = {
        module: "website-builder",
        name: "widget",
        type: "model",
        seeds: [],
      };

      const seedResult = await repository.seed();
      expect(seedResult).toEqual(expectedResult);
      expect(fs.readdir).not.toHaveBeenCalled();
      expect(fs.readFile).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();

      spys.forEach((spy) => spy.mockRestore());
    });

    it("seeding model should create entities from files in config.repository.directory", async () => {
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);

      const dumpEntity = { id: 2 };

      const spys = [
        jest.spyOn(fs, "readdir").mockResolvedValueOnce(["2.json"] as any),
        jest
          .spyOn(fs, "readFile")
          .mockResolvedValueOnce(JSON.stringify(dumpEntity)),
        jest.spyOn(repository, "find").mockResolvedValueOnce([]),
        jest.spyOn(repository, "find").mockResolvedValueOnce([]),
        jest.spyOn(repository, "insert").mockResolvedValueOnce(dumpEntity),
        jest
          .spyOn(repository, "deleteFirstByField")
          .mockResolvedValueOnce(undefined),
      ];

      const expectedResult = {
        module: "website-builder",
        name: "widget",
        type: "model",
        seeds: [
          {
            new: dumpEntity,
            dump: dumpEntity,
          },
        ],
      };

      const seedResult = await repository.seed();
      expect(seedResult).toEqual(expectedResult);

      spys.forEach((spy) => spy.mockClear());
    });

    it("seeding model should updates db entities with data from files in config.repository.directory", async () => {
      const dumpEntity = { id: 2, title: "Like in database entity" };
      const databaseEntity = { id: 1, title: "Like in database entity" };

      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          seed: {
            ...baseConfiguration.seed,
            filters: [
              {
                column: "title",
                method: "eq",
                value: (data) => {
                  return data.entity.dump.title;
                },
              },
            ],
          },
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);

      const spys = [
        jest.spyOn(fs, "readdir").mockResolvedValueOnce(["2.json"] as any),
        jest
          .spyOn(fs, "readFile")
          .mockResolvedValueOnce(JSON.stringify(dumpEntity)),
        jest
          .spyOn(repository, "find")
          .mockReturnValueOnce([databaseEntity] as any)
          .mockReturnValueOnce([databaseEntity] as any),
        jest.spyOn(repository, "insert").mockResolvedValueOnce(dumpEntity),
        jest.spyOn(repository, "deleteFirstByField"),
        jest
          .spyOn(repository, "updateFirstByField")
          .mockResolvedValueOnce({ ...dumpEntity, id: databaseEntity.id }),
      ];

      const expectedResult = {
        module: "website-builder",
        name: "widget",
        type: "model",
        seeds: [
          {
            dump: dumpEntity,
            new: databaseEntity,
            old: databaseEntity,
          },
        ],
      };

      const seedResult = await repository.seed({ seeds: [] });

      expect(seedResult).toEqual(expectedResult);
      expect(repository.deleteFirstByField).not.toHaveBeenCalled();

      spys.forEach((spy) => spy.mockClear());
    });

    it("seeding relation should create entities from files in config.repository.directory if passed transform parameter", async () => {
      const dumpEntity = { id: 4, widgetId: 4 };
      const configuration = new Configuration({
        repository: {
          ...baseConfiguration,
          seed: {
            ...baseConfiguration.seed,
            name: "widgets-to-widgets",
            module: "website-builder",
            type: "relation",
            transformers: [
              {
                field: "widgetId",
                transform: (data) => {
                  const relationEntites = data.seeds
                    .find(
                      (seed) =>
                        seed.name === "widget" &&
                        seed.type === "model" &&
                        seed.module === "website-builder",
                    )
                    ?.seeds?.filter(
                      (seed) => seed.dump.id === data.entity.dump.widgetId,
                    );
                  return relationEntites?.[0].new.id;
                },
              },
            ],
          },
        },
      });
      const container = new Container();
      container
        .bind<IConfiguration>(DI.IConfiguration)
        .toConstantValue(configuration);
      container.bind<IRepository>(DI.IRepository).to(Database);

      const repository = container.get<IRepository>(DI.IRepository);

      const spys = [
        jest.spyOn(fs, "readdir").mockResolvedValueOnce(["4.json"] as any),
        jest
          .spyOn(fs, "readFile")
          .mockResolvedValueOnce(JSON.stringify(dumpEntity)),
        jest.spyOn(repository, "find").mockReturnValueOnce([
          {
            id: 1,
            widgetId: 2,
          },
        ] as any),
        jest
          .spyOn(repository, "insert")
          .mockResolvedValueOnce({ ...dumpEntity, widgetId: 5 }),
        jest
          .spyOn(repository, "deleteFirstByField")
          .mockReturnValueOnce(undefined as any),
        jest
          .spyOn(repository, "updateFirstByField")
          .mockResolvedValueOnce({ ...dumpEntity, widgetId: 5 }),
      ];

      const seedResults: ISeedResult[] = [
        {
          module: "website-builder",
          name: "widget",
          type: "model",
          seeds: [
            {
              dump: {
                id: 4,
              },
              new: {
                id: 5,
              },
              old: {
                id: 2,
              },
            },
          ],
        },
      ];
      const expectedResult = {
        module: "website-builder",
        name: "widgets-to-widgets",
        type: "relation",
        seeds: [
          {
            dump: dumpEntity,
            new: { ...dumpEntity, widgetId: 5 },
          },
        ],
      };
      const seedResult = await repository.seed({ seeds: seedResults });
      expect(seedResult).toEqual(expectedResult);
      spys.forEach((spy) => spy.mockClear());
    });
  });
});
