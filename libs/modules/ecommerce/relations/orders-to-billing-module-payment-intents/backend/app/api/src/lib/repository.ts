import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  trackRepositoryRead,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { and, asc, eq, inArray } from "drizzle-orm";
import { Table } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as OfferAttribute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as AttributeKey } from "@sps/ecommerce/models/attribute-key/backend/repository/database";
import { Table as KeyAttribute } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  stockQuery(offerIds: string[], attributeKey: string) {
    return this.db
      .select({
        offerId: OfferAttribute.storesToProductsId,
        attributeId: Attribute.id,
        number: Attribute.number,
      })
      .from(OfferAttribute)
      .innerJoin(Attribute, eq(Attribute.id, OfferAttribute.attributeId))
      .innerJoin(KeyAttribute, eq(KeyAttribute.attributeId, Attribute.id))
      .innerJoin(AttributeKey, eq(KeyAttribute.attributeKeyId, AttributeKey.id))
      .where(
        and(
          inArray(OfferAttribute.storesToProductsId, offerIds),
          eq(AttributeKey.slug, attributeKey),
        ),
      );
  }

  async stockRowsForOffers(offerIds: string[], attributeKey: string) {
    if (!offerIds.length) {
      return [];
    }
    await Promise.all([
      trackRepositoryRead(OfferAttribute, this.db, {
        and: [
          { column: "storesToProductsId", method: "inArray", value: offerIds },
        ],
      }),
      trackRepositoryRead(Attribute, this.db),
      trackRepositoryRead(KeyAttribute, this.db),
      trackRepositoryRead(AttributeKey, this.db),
    ]);
    return this.stockQuery(offerIds, attributeKey);
  }

  async lockOffers(props: { offerIds: string[] }): Promise<void> {
    if (!consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Offer locks require an owner transaction",
      );
    }
    const ids = [...new Set(props.offerIds)].sort();
    if (!ids.length) {
      return;
    }
    await trackRepositoryRead(Offer, this.db, {
      and: [{ column: "id", method: "inArray", value: ids }],
    });
    const rows = await this.db
      .select({ id: Offer.id })
      .from(Offer)
      .where(inArray(Offer.id, ids))
      .orderBy(asc(Offer.id))
      .for("update");
    if (rows.length !== ids.length) {
      throw new Error("Not Found error. A reserved offer is missing");
    }
  }

  withOfferLocks<T>(
    props: { offerIds: string[] },
    operation: () => Promise<T>,
  ): Promise<T> {
    const run = async () => {
      await this.lockOffers(props);
      return operation();
    };
    if (consistencyContext.getStore()?.database) {
      return run();
    }
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }
}
