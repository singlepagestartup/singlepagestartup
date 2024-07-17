import fs from "fs/promises";
import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { action } from "../find";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export class Dumper {
  findAction: typeof action;
  table: PgTableWithColumns<any>;
  seedsPath = `${__dirname}/../seed/seeds`;
  skip: boolean;
  db: PostgresJsDatabase<any>;
  schemaName: keyof typeof this.db._.fullSchema;

  constructor(props: {
    table: PgTableWithColumns<any>;
    db: PostgresJsDatabase<any>;
    schemaName: keyof typeof props.db._.fullSchema;
    seedsPath?: string;
    skip?: boolean;
  }) {
    this.findAction = action;
    this.table = props.table;
    this.skip = props.skip || false;

    if (props.seedsPath) {
      this.seedsPath = props.seedsPath;
    }
  }

  async init() {
    await this.clearFolder();
  }

  async clearFolder() {
    const seedFiles = await fs.readdir(this.seedsPath);

    const sanitizedFiles = seedFiles.filter((file) => file.endsWith(".json"));

    for (const sanitizedFile of sanitizedFiles) {
      await fs.unlink(`${this.seedsPath}/${sanitizedFile}`);
    }
  }

  async dump() {
    if (this.skip) {
      return;
    }

    await this.init();

    const entities = await this.findAction({
      db: this.db,
      schemaName: this.schemaName,
    });

    for (const entity of entities) {
      const fileContent = JSON.stringify(entity, null, 2);

      await fs.writeFile(`${this.seedsPath}/${entity.id}.json`, fileContent);
    }
  }
}
