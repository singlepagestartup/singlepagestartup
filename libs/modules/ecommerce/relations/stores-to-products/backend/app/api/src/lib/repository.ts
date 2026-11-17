import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { inArray, type InferSelectModel } from "drizzle-orm";
import { type PgTable, type PgColumn } from "drizzle-orm/pg-core";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import { Table as Link } from "@sps/ecommerce/relations/offers-to-offers/backend/repository/database";
import { Table as OfferAttribute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
import { Table as ProductAttribute } from "@sps/ecommerce/relations/products-to-attributes/backend/repository/database";
import { Table as StoreAttribute } from "@sps/ecommerce/relations/stores-to-attributes/backend/repository/database";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as AttributeKey } from "@sps/ecommerce/models/attribute-key/backend/repository/database";
import { Table as KeyValue } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
import { Table as ValueCurrency } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/repository/database";
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";

export interface IOfferAttribute {
  id: string;
  key: string;
  type: string;
  field: string;
  number: string | null;
  text: string | undefined;
  currencyIds: string[];
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  private async list<T extends PgTable>(
    table: T,
    column: PgColumn,
    property: string,
    ids: string[],
  ): Promise<InferSelectModel<T>[]> {
    const values = [...new Set(ids)];
    if (!values.length) {
      return [];
    }
    await trackRepositoryRead(table, this.db, {
      and: [{ column: property, method: "inArray", value: values }],
    });
    // The dynamic table and its column are supplied together at each call site.
    const rows = await this.db
      .select()
      .from(table as PgTable)
      .where(inArray(column, values));
    return rows as InferSelectModel<T>[];
  }

  async catalog(offerId: string | string[]) {
    const roots = Array.isArray(offerId) ? offerId : [offerId];
    const links = await this.list(
      Link,
      Link.sourceOfferId,
      "sourceOfferId",
      roots,
    );
    const options = links.filter((link) => link.variant !== "fulfilled-by");
    const fulfilment = await this.list(
      Link,
      Link.sourceOfferId,
      "sourceOfferId",
      options.map((link) => link.targetOfferId),
    );
    const providers = [...links, ...fulfilment].filter(
      (link) => link.variant === "fulfilled-by",
    );
    const offerIds = [
      ...roots,
      ...options.map((link) => link.targetOfferId),
      ...providers.map((link) => link.targetOfferId),
    ];
    const offers = await this.list(Table, Table.id, "id", offerIds);
    const productIds = offers.map((offer) => offer.productId);
    const storeIds = offers.map((offer) => offer.storeId);
    const [products, byOffer, byProduct, byStore] = await Promise.all([
      this.list(Product, Product.id, "id", productIds),
      this.list(
        OfferAttribute,
        OfferAttribute.storesToProductsId,
        "storesToProductsId",
        offerIds,
      ),
      this.list(
        ProductAttribute,
        ProductAttribute.productId,
        "productId",
        productIds,
      ),
      this.list(StoreAttribute, StoreAttribute.storeId, "storeId", storeIds),
    ]);
    const ids = [...byOffer, ...byProduct, ...byStore].map(
      (row) => row.attributeId,
    );
    const [attributes, keyLinks, currencyLinks] = await Promise.all([
      this.list(Attribute, Attribute.id, "id", ids),
      this.list(KeyValue, KeyValue.attributeId, "attributeId", ids),
      this.list(ValueCurrency, ValueCurrency.attributeId, "attributeId", ids),
    ]);
    const [keys, currencies] = await Promise.all([
      this.list(
        AttributeKey,
        AttributeKey.id,
        "id",
        keyLinks.map((row) => row.attributeKeyId),
      ),
      this.list(
        Currency,
        Currency.id,
        "id",
        currencyLinks.map((row) => row.billingModuleCurrencyId),
      ),
    ]);
    const keyById = new Map(keys.map((key) => [key.id, key]));
    const attrById = new Map(attributes.map((attr) => [attr.id, attr]));
    const currenciesByAttribute = new Map<string, string[]>();
    for (const link of currencyLinks) {
      const list = currenciesByAttribute.get(link.attributeId) ?? [];
      list.push(link.billingModuleCurrencyId);
      currenciesByAttribute.set(link.attributeId, list);
    }
    const values = new Map<string, IOfferAttribute[]>();
    for (const link of keyLinks) {
      const key = keyById.get(link.attributeKeyId);
      const value = attrById.get(link.attributeId);
      if (key && value) {
        const rows = values.get(value.id) ?? [];
        rows.push({
          id: value.id,
          key: key.slug,
          type: key.type,
          field: key.field,
          number: value.number,
          text: value.string?.en,
          currencyIds: currenciesByAttribute.get(value.id) ?? [],
        });
        values.set(value.id, rows);
      }
    }
    function group<T extends { attributeId: string }>(
      rows: T[],
      ownerId: (row: T) => string,
    ) {
      const grouped = new Map<string, IOfferAttribute[]>();
      for (const row of rows) {
        const id = ownerId(row);
        const list = grouped.get(id) ?? [];
        list.push(...(values.get(row.attributeId) ?? []));
        grouped.set(id, list);
      }
      return grouped;
    }
    return {
      offers: new Map(offers.map((offer) => [offer.id, offer])),
      products: new Map(products.map((product) => [product.id, product])),
      links: options,
      providers,
      currencies,
      offerAttributes: group(byOffer, (row) => row.storesToProductsId),
      productAttributes: group(byProduct, (row) => row.productId),
      storeAttributes: group(byStore, (row) => row.storeId),
    };
  }
}
export type IOfferCatalog = Awaited<ReturnType<Repository["catalog"]>>;
