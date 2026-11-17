import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/offers-to-offers/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import { asc, eq, inArray } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  private async withWriteLock<T>(work: () => Promise<T>) {
    if (consistencyContext.getStore()?.database) {
      return work();
    }
    return this.db.transaction((tx) => withConsistencyDatabase(tx, work));
  }

  private async assertLink(data: typeof Table.$inferInsert) {
    const offers = await this.db
      .select({ offer: Offer, kind: Product.kind })
      .from(Offer)
      .innerJoin(Product, eq(Product.id, Offer.productId))
      .where(inArray(Offer.id, [data.sourceOfferId, data.targetOfferId]))
      .orderBy(asc(Offer.id))
      .for("share");
    const source = offers.find(
      (record) => record.offer.id === data.sourceOfferId,
    );
    const target = offers.find(
      (record) => record.offer.id === data.targetOfferId,
    );
    if (
      !source ||
      !target ||
      source.offer.id === target.offer.id ||
      source.offer.variant !== "default" ||
      target.kind !== "service"
    ) {
      throw new Error("Validation error. Invalid source offer or service");
    }
    if (data.variant === "fulfilled-by") {
      if (
        target.offer.variant !== "provider" ||
        source.offer.productId !== target.offer.productId
      ) {
        throw new Error(
          "Validation error. Provider must fulfill the same service product",
        );
      }
    } else if (
      target.offer.variant !== "default" ||
      target.offer.storeId !== source.offer.storeId
    ) {
      throw new Error(
        "Validation error. Delivery and add-ons must belong to the seller",
      );
    }
  }

  override async insert(data: typeof Table.$inferInsert) {
    return this.withWriteLock(async () => {
      await this.assertLink(data);
      return super.insert(data);
    });
  }

  override async updateFirstByField(
    field: string,
    value: unknown,
    data: Partial<typeof Table.$inferSelect>,
  ) {
    if (field !== "id" || typeof value !== "string") {
      throw new Error("Validation error. Offer links are updated by ID");
    }
    return this.withWriteLock(async () => {
      const [previous] = await this.db
        .select()
        .from(Table)
        .where(eq(Table.id, value))
        .for("update");
      if (!previous) {
        return null;
      }
      await this.assertLink({ ...previous, ...data });
      return super.updateFirstByField(field, value, data);
    });
  }
}
