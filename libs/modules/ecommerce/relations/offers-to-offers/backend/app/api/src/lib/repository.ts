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
import { asc, eq, inArray, sql } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async withWriteLock<T>(work: () => Promise<T>) {
    if (consistencyContext.getStore()?.database) {
      return work();
    }
    return this.db.transaction((tx) => withConsistencyDatabase(tx, work));
  }

  async lockTargetService(targetOfferId: string) {
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`ecommerce.offer-service:${targetOfferId}`}))`,
    );
  }

  async lockOfferProducts(offerIds: string[]) {
    // Lock both offers and their Products before the service reads validation data.
    await this.db
      .select({ id: Offer.id })
      .from(Offer)
      .innerJoin(Product, eq(Product.id, Offer.productId))
      .where(inArray(Offer.id, offerIds))
      .orderBy(asc(Offer.id))
      .for("share");
  }

  async lockById(id: string) {
    const [record] = await this.db
      .select()
      .from(Table)
      .where(eq(Table.id, id))
      .for("update");
    return record;
  }
}
