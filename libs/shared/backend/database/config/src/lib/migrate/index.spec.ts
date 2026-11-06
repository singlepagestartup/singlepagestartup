import { Config } from "./index";
import { getDrizzle } from "../postgres";
import { migrate as migrateAll } from "drizzle-orm/postgres-js/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { PgDialect } from "drizzle-orm/pg-core";

jest.mock("../postgres", () => ({
  getDrizzle: jest.fn(),
  getPostgresClient: () => ({ end: jest.fn() }),
  resetPostgresClient: jest.fn(),
}));
jest.mock("@sps/shared-utils", () => ({
  DATABASE_OPTIONS: { host: "test", port: 5432 },
}));
jest.mock("@sps/backend-utils", () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));
jest.mock("drizzle-orm/postgres-js/migrator", () => ({ migrate: jest.fn() }));
jest.mock("drizzle-orm/migrator", () => ({ readMigrationFiles: jest.fn() }));
jest.mock("drizzle-orm/pg-core", () => ({
  PgDialect: jest.fn(),
  getTableConfig: jest.fn(),
}));

const apply = jest.fn();
const session = {};
const migrations = [0, 1, 2, 3].map((index) => ({
  sql: [`generated-${index}`],
  hash: String(index),
  folderMillis: index,
  bps: true,
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
  jest.mocked(getDrizzle).mockReturnValue({
    _: { session },
    execute: jest.fn(async () => []),
  } as any);
  jest.mocked(readMigrationFiles).mockReturnValue(migrations);
  jest.mocked(PgDialect).mockImplementation(() => ({ migrate: apply }) as any);
});
afterEach(() => jest.restoreAllMocks());
const config = () =>
  new Config({
    schemaPaths: [],
    migrationsFolder: "/generated",
    migrationsTable: "page",
    schema: {},
  });
it("keeps ordinary migrations on the existing complete migration path", async () => {
  await config().migrate();
  expect(migrateAll).toHaveBeenCalledTimes(1);
  expect(apply).not.toHaveBeenCalled();
});
it("applies only the requested generated prefix through Drizzle's normal journal", async () => {
  await config().migrate({ through: 2 });
  expect(apply).toHaveBeenCalledWith(migrations.slice(0, 3), session, {
    migrationsFolder: "/generated",
    migrationsTable: "page",
  });
  expect(migrateAll).not.toHaveBeenCalled();
});
it.each([-1, 1.5, 10, NaN])(
  "refuses invalid migration index %s before applying generated DDL",
  async (through) => {
    await config().migrate({ through });
    expect(apply).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  },
);
