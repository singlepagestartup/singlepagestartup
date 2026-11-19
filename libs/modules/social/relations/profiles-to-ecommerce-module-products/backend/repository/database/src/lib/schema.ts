import * as pgCore from "drizzle-orm/pg-core";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as EcommerceModuleProduct } from "@sps/ecommerce/models/product/backend/repository/database";
import { Table as Store } from "@sps/ecommerce/models/store/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as Category } from "@sps/ecommerce/models/category/backend/repository/database";

export const moduleName = "sl";
export const table = "pe_to_ee_me_ps_4b2";

const pgTable = pgCore.pgTableCreator((name) => `${moduleName}_${name}`);

export const Table = pgTable(
  table,
  {
    id: pgCore.uuid("id").primaryKey().defaultRandom(),
    createdAt: pgCore.timestamp("created_at").notNull().defaultNow(),
    updatedAt: pgCore.timestamp("updated_at").notNull().defaultNow(),
    variant: pgCore.text("variant").notNull().default("default"),
    orderIndex: pgCore.integer("order_index").notNull().default(0),
    className: pgCore.text("class_name"),
    profileId: pgCore
      .uuid("pe_id")
      .notNull()
      .references(() => Profile.id, { onDelete: "cascade" }),
    ecommerceModuleProductId: pgCore
      .uuid("ee_me_pt_id")
      .references(() => EcommerceModuleProduct.id, { onDelete: "cascade" }),
    storeId: pgCore
      .uuid("store_id")
      .references(() => Store.id, { onDelete: "cascade" }),
    offerId: pgCore
      .uuid("offer_id")
      .references(() => Offer.id, { onDelete: "cascade" }),
    categoryId: pgCore
      .uuid("category_id")
      .references(() => Category.id, { onDelete: "cascade" }),
  },
  (table) => ({
    storeExpert: pgCore
      .index("sl_profile_store_expert")
      .on(
        table.storeId,
        table.offerId,
        table.ecommerceModuleProductId,
        table.categoryId,
      ),
  }),
);
