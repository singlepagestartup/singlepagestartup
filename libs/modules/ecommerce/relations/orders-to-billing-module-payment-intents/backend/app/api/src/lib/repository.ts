import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  trackRepositoryRead,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { db } from "@sps/providers-db";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { Table } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as OfferAttribute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as AttributeKey } from "@sps/ecommerce/models/attribute-key/backend/repository/database";
import { Table as KeyAttribute } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
import { Repository as AttributeRepository } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/repository";
import { Configuration as AttributeConfiguration } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/configuration";

export interface IReservedOfferQuantitiesProps {
  offerIds: string[];
  excludePaymentIntentId?: string;
  database?: Pick<typeof db, "select">;
}

export async function reservedOfferQuantities(
  props: IReservedOfferQuantitiesProps,
): Promise<Record<string, number>> {
  const offerIds = [...new Set(props.offerIds)];
  const quantities: Record<string, number> = Object.fromEntries(
    offerIds.map((id) => [id, 0]),
  );
  if (!offerIds.length) {
    return quantities;
  }
  const database =
    props.database ?? consistencyContext.getStore()?.database ?? db;
  await trackRepositoryRead(Table, database, {
    and: [{ column: "offerId", method: "inArray", value: offerIds }],
  });
  const conditions = [
    inArray(Table.offerId, offerIds),
    inArray(Table.reservationStatus, ["held", "reconciliation"]),
  ];
  if (props.excludePaymentIntentId) {
    conditions.push(
      ne(Table.billingModulePaymentIntentId, props.excludePaymentIntentId),
    );
  }
  const rows = await database
    .select({ offerId: Table.offerId, quantity: Table.reservationQuantity })
    .from(Table)
    .where(and(...conditions));
  for (const row of rows) {
    if (row.offerId) {
      quantities[row.offerId] += row.quantity;
    }
  }
  return quantities;
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  stockQuery(offerIds: string[]) {
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
          eq(AttributeKey.slug, "stock_quantity"),
        ),
      );
  }

  async stockForOffers(offerIds: string[]) {
    if (!offerIds.length) {
      return new Map<string, { attributeId: string; quantity: number }>();
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
    const rows = await this.stockQuery(offerIds);
    const result = new Map<string, { attributeId: string; quantity: number }>();
    for (const row of rows) {
      if (
        result.has(row.offerId) ||
        row.number === null ||
        !/^\d+(?:\.0+)?$/.test(row.number) ||
        !Number.isSafeInteger(Number(row.number))
      ) {
        throw new Error(
          "Configuration error. Reserved offer stock is invalid or ambiguous",
        );
      }
      result.set(row.offerId, {
        attributeId: row.attributeId,
        quantity: Number(row.number),
      });
    }
    return result;
  }

  async writeStock(attributeId: string, quantity: number) {
    const repository = new AttributeRepository(new AttributeConfiguration());
    repository.db = this.db;
    await repository.updateFirstByField("id", attributeId, {
      number: String(quantity),
    });
  }

  reservedQuantities(props: Omit<IReservedOfferQuantitiesProps, "database">) {
    return reservedOfferQuantities({ ...props, database: this.db });
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
