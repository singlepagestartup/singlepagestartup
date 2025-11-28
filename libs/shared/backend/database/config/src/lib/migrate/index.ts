import { DATABASE_OPTIONS } from "@sps/shared-utils";
import { Config as DrizzleConfig, defineConfig } from "drizzle-kit";
import { getDrizzle } from "../postgres";
import { migrate as drizzleMigrator } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { logger } from "@sps/backend-utils";

export class Config {
  out: string;
  schemaPaths: string[];
  drizzleConfig: DrizzleConfig;
  migrationsTable: string;
  migrationsFolder: string;
  schema: any;

  constructor(props: {
    schemaPaths: string[];
    migrationsTable: string;
    migrationsFolder: string;
    schema: any;
  }) {
    this.out = "./src/lib/migrations";
    this.schemaPaths = props.schemaPaths;
    this.migrationsTable = props.migrationsTable;
    this.migrationsFolder = props.migrationsFolder;
    this.schema = props.schema;
  }

  init() {
    this.drizzleConfig = defineConfig({
      schema: this.schemaPaths,
      out: this.out,
      dialect: "postgresql",
      dbCredentials: DATABASE_OPTIONS,
      verbose: true,
      strict: true,
    }) satisfies DrizzleConfig;
  }

  config() {
    this.init();

    return this.drizzleConfig;
  }

  async migrate() {
    try {
      if (Object.keys(DATABASE_OPTIONS).length < 2) {
        throw new Error(
          "Configuration error. Database credentials are missing",
        );
      }

      let beforeMigrations = [];

      const db = getDrizzle({ schema: this.schema });

      try {
        beforeMigrations = await db.execute(
          sql`SELECT * FROM drizzle.${sql.raw(this.migrationsTable)}`,
        );
      } catch (error: any) {
        if (!error.message.includes("does not exist")) {
          throw error;
        }
      }

      await drizzleMigrator(db, {
        migrationsFolder: this.migrationsFolder,
        migrationsTable: this.migrationsTable,
      });

      const afterMigrations = await db.execute(
        sql`SELECT * FROM drizzle.${sql.raw(this.migrationsTable)}`,
      );

      if (beforeMigrations.length !== afterMigrations.length) {
        logger.info("NEW_MIGRATIONS=true");
      }

      process.exit(0);
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  }
}
