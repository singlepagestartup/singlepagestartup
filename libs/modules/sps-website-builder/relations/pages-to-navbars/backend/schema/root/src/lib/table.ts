import * as pgCore from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { Table as Page } from "@sps/sps-website-builder-models-page-backend-schema-table";
import { Table as Navbar } from "@sps/sps-website-builder-models-navbar-backend-schema-table";

export const modelName = "SPSWBPagesToNavbars";

const moduleName = "sps_w_b";
const table = "pages_to_navbars";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(table, {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  pageId: pgCore
    .uuid("page_id")
    .notNull()
    .references(() => Page.id, { onDelete: "cascade" }),
  navbarId: pgCore
    .uuid("navbar_id")
    .notNull()
    .references(() => Navbar.id, { onDelete: "cascade" }),
});

export const insertSchema = createInsertSchema(Table);
export const selectSchema = createSelectSchema(Table);
