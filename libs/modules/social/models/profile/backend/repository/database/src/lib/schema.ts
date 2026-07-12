import * as pgCore from "drizzle-orm/pg-core";
import { fields } from "./fields";

export {
  supportedMcpServerIdentifiers,
  type TSupportedMcpServerIdentifier,
} from "./fields/singlepage";

export const moduleName = "sl";
export const table = "profile";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  ...fields,
});
