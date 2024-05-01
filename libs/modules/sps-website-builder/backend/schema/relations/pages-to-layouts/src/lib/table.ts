import * as pgCore from "drizzle-orm/pg-core";
import { Table as PagesTable } from "@sps/sps-website-builder-models-page-backend-schema-table";
import { Table as LayoutsTable } from "@sps/sps-website-builder-models-layout-backend-schema-table";

const moduleNameSnakeCased = "sps_website_builder";
const modelNameSnakeCasedPluralized = "pages_to_layouts";

const pgTable = pgCore.pgTableCreator(
  (name) => `${moduleNameSnakeCased}_${name}`,
);

export const Table = pgTable(
  modelNameSnakeCasedPluralized,
  {
    pageId: pgCore
      .uuid("page_id")
      .notNull()
      .references(() => PagesTable.id),
    layoutId: pgCore
      .uuid("layout_id")
      .notNull()
      .references(() => LayoutsTable.id),
  },
  (t) => ({
    pk: pgCore.primaryKey({ columns: [t.pageId, t.layoutId] }),
  }),
);
