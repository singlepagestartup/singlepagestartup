import type { CRUDService } from "@sps/shared-backend-api";
import type { Table } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import type { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import type { Table as Link } from "@sps/ecommerce/relations/offers-to-offers/backend/repository/database";
import type { Table as OfferAttribute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
import type { Table as ProductAttribute } from "@sps/ecommerce/relations/products-to-attributes/backend/repository/database";
import type { Table as StoreAttribute } from "@sps/ecommerce/relations/stores-to-attributes/backend/repository/database";
import type { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import type { Table as AttributeKey } from "@sps/ecommerce/models/attribute-key/backend/repository/database";
import type { Table as KeyValue } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
import type { Table as ValueCurrency } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/repository/database";
import type { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";

export interface IConstructorProps {
  offers: Pick<CRUDService<typeof Table.$inferSelect>, "find">;
  products: Pick<CRUDService<typeof Product.$inferSelect>, "find">;
  links: Pick<CRUDService<typeof Link.$inferSelect>, "find">;
  offerAttributes: Pick<
    CRUDService<typeof OfferAttribute.$inferSelect>,
    "find"
  >;
  productAttributes: Pick<
    CRUDService<typeof ProductAttribute.$inferSelect>,
    "find"
  >;
  storeAttributes: Pick<
    CRUDService<typeof StoreAttribute.$inferSelect>,
    "find"
  >;
  attributes: Pick<CRUDService<typeof Attribute.$inferSelect>, "find">;
  attributeKeys: Pick<CRUDService<typeof AttributeKey.$inferSelect>, "find">;
  keyValues: Pick<CRUDService<typeof KeyValue.$inferSelect>, "find">;
  valueCurrencies: Pick<CRUDService<typeof ValueCurrency.$inferSelect>, "find">;
  currencies: Pick<CRUDService<typeof Currency.$inferSelect>, "find">;
}

export interface IOfferAttribute {
  id: string;
  key: string;
  type: string;
  field: string;
  number: string | null;
  text: string | undefined;
  currencyIds: string[];
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  private async list<T extends Record<string, unknown>>(
    reader: Pick<CRUDService<T>, "find">,
    property: string,
    ids: string[],
  ): Promise<T[]> {
    const values = [...new Set(ids)];
    if (!values.length) {
      return [];
    }
    return reader.find({
      params: {
        filters: {
          and: [{ column: property, method: "inArray", value: values }],
        },
      },
    });
  }

  async catalog(offerId: string | string[]) {
    const roots = Array.isArray(offerId) ? offerId : [offerId];
    const requested = await this.list(this.dependencies.offers, "id", roots);
    const siblings = await this.list(
      this.dependencies.offers,
      "productId",
      requested.map((offer) => offer.productId),
    );
    const sourceIds = siblings.map((offer) => offer.id);
    const links = await this.list(
      this.dependencies.links,
      "sourceOfferId",
      sourceIds,
    );
    const options = links.filter((link) => link.variant !== "fulfilled-by");
    const fulfilment = await this.list(
      this.dependencies.links,
      "sourceOfferId",
      options.map((link) => link.targetOfferId),
    );
    const providers = [
      ...new Map(
        [...links, ...fulfilment]
          .filter((link) => link.variant === "fulfilled-by")
          .map((link) => [link.id, link]),
      ).values(),
    ];
    const offerIds = [
      ...roots,
      ...sourceIds,
      ...options.map((link) => link.targetOfferId),
      ...providers.map((link) => link.targetOfferId),
    ];
    const offers = await this.list(this.dependencies.offers, "id", offerIds);
    const productIds = offers.map((offer) => offer.productId);
    const storeIds = offers.map((offer) => offer.storeId);
    const [products, byOffer, byProduct, byStore] = await Promise.all([
      this.list(this.dependencies.products, "id", productIds),
      this.list(
        this.dependencies.offerAttributes,
        "storesToProductsId",
        offerIds,
      ),
      this.list(this.dependencies.productAttributes, "productId", productIds),
      this.list(this.dependencies.storeAttributes, "storeId", storeIds),
    ]);
    const ids = [...byOffer, ...byProduct, ...byStore].map(
      (row) => row.attributeId,
    );
    const [attributes, keyLinks, currencyLinks] = await Promise.all([
      this.list(this.dependencies.attributes, "id", ids),
      this.list(this.dependencies.keyValues, "attributeId", ids),
      this.list(this.dependencies.valueCurrencies, "attributeId", ids),
    ]);
    const [keys, currencies] = await Promise.all([
      this.list(
        this.dependencies.attributeKeys,
        "id",
        keyLinks.map((row) => row.attributeKeyId),
      ),
      this.list(
        this.dependencies.currencies,
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

  async addressSuggestionsOffer(offerId: string) {
    const [offer] = await this.list(this.dependencies.offers, "id", [offerId]);
    if (!offer) {
      return undefined;
    }
    const [product] = await this.list(this.dependencies.products, "id", [
      offer.productId,
    ]);
    let hasDeliveryLink = false;
    if (!offer.settings.receiptMethod) {
      const links = await this.dependencies.links.find({
        params: {
          filters: {
            and: [
              { column: "targetOfferId", method: "eq", value: offerId },
              { column: "variant", method: "eq", value: "delivery" },
            ],
          },
          limit: 1,
        },
      });
      hasDeliveryLink = links.length > 0;
    }
    return { offer, product, hasDeliveryLink };
  }
}
export type IOfferCatalog = Awaited<ReturnType<Service["catalog"]>>;
