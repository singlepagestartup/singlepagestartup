import type { IModel as IOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { randomUUID } from "node:crypto";
import { compileTariffFormula } from "@sps/backend-utils";
import type { FindServiceProps } from "@sps/shared-backend-api";
import {
  catalogCreateOfferSchema,
  catalogMutationSchema,
  catalogEntitySchemas,
  type ICatalogMutationInput,
  catalogSetAttributeSchema,
  type ICatalogCreateOfferInput,
  type ICatalogCreateOfferResult,
  type ICatalogSetAttributeInput,
} from "@sps/rbac/models/subject/sdk/model/src/lib/ecommerce-catalog";

export interface IRecord {
  id: string;
  [key: string]: unknown;
}
export interface IEntityService {
  find(props?: FindServiceProps): Promise<IRecord[]>;
  findById(props: { id: string }): Promise<IRecord | null | undefined>;
  create(props: { data: Record<string, unknown> }): Promise<IRecord>;
  delete?(props: { id: string }): Promise<IRecord>;
  update(props: {
    id: string;
    data: Record<string, unknown>;
  }): Promise<IRecord>;
}
export interface IConstructorProps {
  repository: {
    withCatalogLock<T>(keys: string[], operation: () => Promise<T>): Promise<T>;
  };
  entities: Record<string, IEntityService>;
  isAdmin(subjectId: string): Promise<boolean>;
  validateWorkTariff(offerId: string, expression?: string): Promise<unknown>;
  stock: {
    withOfferLocks<T>(
      props: { offerIds: string[] },
      operation: () => Promise<T>,
    ): Promise<T>;
    reservedQuantities(props: {
      offerIds: string[];
    }): Promise<Record<string, number>>;
  };
}
export interface IMutation {
  subjectId?: string;
  expectedUpdatedAt?: string;
  operator?: boolean;
  entity: string;
  id?: string;
  method: string;
  data: Record<string, unknown>;
}

export class Service {
  constructor(readonly dependencies: IConstructorProps) {}

  async context(subjectId: string) {
    const admin = await this.dependencies.isAdmin(subjectId);
    const grants = await this.find("subjects-to-ecommerce-module-stores", {
      subjectId,
      variant: "owner",
    });
    const ids = new Set(
      grants.map((grant) => String(grant.ecommerceModuleStoreId)),
    );
    const stores = await this.entity("stores").find();
    const ownedStores = stores.filter((store) => admin || ids.has(store.id));
    const [products, currencies] = await Promise.all([
      this.entity("products").find({
        params: {
          filters: {
            and: [{ column: "variant", method: "eq", value: "default" }],
          },
          limit: 200,
        },
      }),
      this.entity("currencies").find(),
    ]);
    const productGrants = await this.find(
      "subjects-to-ecommerce-module-products",
      { subjectId, variant: "owner" },
    );
    const ownedProductIds = admin
      ? products.map((product) => product.id)
      : productGrants.map((grant) => String(grant.ecommerceModuleProductId));
    const offers = await this.entity("stores-to-products").find();
    const writableOffers = offers.filter((offer) =>
      ownedStores.some((store) => store.id === offer.storeId),
    );
    const references: {
      relationId: string;
      attributeId: string;
      owner: { type: "store" | "product" | "offer"; id: string };
    }[] = [];
    for (const [relation, column, type, ownerIds] of [
      [
        "stores-to-attributes",
        "storeId",
        "store",
        ownedStores.map((store) => store.id),
      ],
      ["products-to-attributes", "productId", "product", ownedProductIds],
      [
        "stores-to-products-to-attributes",
        "storesToProductsId",
        "offer",
        writableOffers.map((offer) => offer.id),
      ],
    ] as const) {
      if (!ownerIds.length) {
        continue;
      }
      const rows = await this.entity(relation).find({
        params: {
          filters: {
            and: [{ column, method: "inArray", value: [...ownerIds] }],
          },
        },
      });
      for (const row of rows) {
        references.push({
          relationId: row.id,
          attributeId: String(row.attributeId),
          owner: { type, id: String(row[column]) },
        });
      }
    }
    const attributeIds = [
      ...new Set(references.map((reference) => reference.attributeId)),
    ];
    const [attributeRows, keyLinks, currencyLinks, keys, allLinks] =
      await Promise.all([
        attributeIds.length
          ? this.entity("attributes").find({
              params: {
                filters: {
                  and: [
                    { column: "id", method: "inArray", value: attributeIds },
                  ],
                },
              },
            })
          : [],
        attributeIds.length
          ? this.entity("attribute-keys-to-attributes").find({
              params: {
                filters: {
                  and: [
                    {
                      column: "attributeId",
                      method: "inArray",
                      value: attributeIds,
                    },
                  ],
                },
              },
            })
          : [],
        attributeIds.length
          ? this.entity("attributes-to-billing-module-currencies").find({
              params: {
                filters: {
                  and: [
                    {
                      column: "attributeId",
                      method: "inArray",
                      value: attributeIds,
                    },
                  ],
                },
              },
            })
          : [],
        this.entity("attribute-keys").find(),
        this.entity("offers-to-offers").find(),
      ]);
    const attributes = references.flatMap((reference) => {
      const attribute = attributeRows.find(
        (row) => row.id === reference.attributeId,
      );
      if (!attribute) {
        return [];
      }
      return keyLinks
        .filter((link) => link.attributeId === attribute.id)
        .flatMap((link) => {
          const key = keys.find((key) => key.id === link.attributeKeyId);
          if (!key) {
            return [];
          }
          const currency = currencyLinks.find(
            (link) => link.attributeId === attribute.id,
          );
          return [
            {
              id: attribute.id,
              relationId: reference.relationId,
              owner: reference.owner,
              key: String(key.slug),
              type: String(key.type),
              field: String(key.field),
              number:
                attribute.number == null ? null : String(attribute.number),
              text: String(
                (attribute.string as Record<string, unknown> | null)?.en ?? "",
              ),
              currencyId: currency
                ? String(currency.billingModuleCurrencyId)
                : undefined,
            },
          ];
        });
    });
    const productIds = new Set([
      ...ownedProductIds,
      ...writableOffers.map((offer) => String(offer.productId)),
    ]);
    const serviceProductIds = new Set(
      products
        .filter((product) => product.kind === "service")
        .map((product) => product.id),
    );
    const offersById = new Map(offers.map((offer) => [offer.id, offer]));
    return {
      stores: ownedStores,
      products,
      currencies,
      offers: offers.filter(
        (offer) =>
          offer.variant === "provider" ||
          (offer.variant === "default" &&
            serviceProductIds.has(String(offer.productId))) ||
          writableOffers.some((owned) => owned.id === offer.id),
      ),
      links: allLinks.flatMap((link) => {
        const source = offersById.get(String(link.sourceOfferId));
        if (!source) {
          return [];
        }
        const visible =
          link.variant === "fulfilled-by"
            ? writableOffers.some((offer) => offer.id === source.id)
            : productIds.has(String(source.productId));
        return visible ? [{ ...link, sourceProductId: source.productId }] : [];
      }),
      attributes,
      ownedProductIds,
    };
  }

  protected entity(name: string) {
    const service = this.dependencies.entities[name];
    if (!service) {
      throw new Error("Validation error. Unsupported catalogue entity");
    }
    return service;
  }

  protected async find(name: string, fields: Record<string, unknown>) {
    const result = await this.entity(name).find({
      params: {
        filters: {
          and: Object.entries(fields).map(([column, value]) => ({
            column,
            method: "eq",
            value: value as string,
          })),
        },
      },
    });
    return result.filter((row) =>
      Object.entries(fields).every(([key, value]) => row[key] === value),
    );
  }

  protected async record(name: string, id: string) {
    const record = await this.entity(name).findById({ id });
    if (!record) {
      throw new Error("Validation error. Catalogue record is unavailable");
    }
    return record;
  }

  protected denied(): never {
    throw new Error(
      "Permission error. This catalogue record belongs to another owner",
    );
  }

  private async validateProductFormula(
    expression: string,
    productIds: string[],
  ) {
    const compiled = compileTariffFormula(expression);
    if (
      compiled.variables.includes("provider_usd") &&
      !compiled.isLinearIn("provider_usd")
    ) {
      throw new Error(
        "Validation error. Work pricing must be proportional to provider_usd",
      );
    }
    for (const productId of productIds) {
      const offers = await this.find("stores-to-products", { productId });
      for (const offer of offers) {
        const settings = offer.settings as IOffer["settings"] | undefined;
        if (
          !settings?.workTokenPricing ||
          settings.closedForNewOrders ||
          settings.workTokenPricing.multiplier !== undefined
        ) {
          continue;
        }
        await this.validateWorkOffer(offer.id, expression);
      }
    }
  }

  private async validateWorkOffer(offerId: string, expression?: string) {
    try {
      await this.dependencies.validateWorkTariff(offerId, expression);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.startsWith("Configuration error. ")
      ) {
        throw error;
      }
      throw new Error(
        error.message.replace("Configuration error. ", "Validation error. "),
      );
    }
  }

  async assertOwner(
    subjectId: string,
    type: "store" | "product" | "offer",
    id: string,
    admin?: boolean,
  ) {
    if (admin ?? (await this.dependencies.isAdmin(subjectId))) {
      return;
    }
    if (type === "offer" || type === "product") {
      const offers = await this.find("stores-to-products", {
        [type === "offer" ? "id" : "productId"]: id,
      });
      if (
        offers.some(
          (offer) =>
            (offer.settings as IOffer["settings"] | undefined)?.initialGrant ===
              true ||
            (offer.settings as IOffer["settings"] | undefined)
              ?.initialGrantLegacyHistory === true,
        )
      ) {
        throw new Error(
          "Permission error. Registration grants require an administrator",
        );
      }
    }
    if (type === "offer") {
      const offer = await this.record("stores-to-products", id);
      await this.assertOwner(subjectId, "store", String(offer.storeId), false);
      return;
    }
    const model = type === "store" ? "stores" : "products";
    const column =
      type === "store" ? "ecommerceModuleStoreId" : "ecommerceModuleProductId";
    const grants = await this.find(`subjects-to-ecommerce-module-${model}`, {
      [column]: id,
      variant: "owner",
    });
    if (grants.length !== 1 || grants[0].subjectId !== subjectId) {
      this.denied();
    }
  }

  protected async attributeOwners(attributeId: string) {
    const scopes: { type: "store" | "product" | "offer"; id: string }[] = [];
    for (const [relation, column, type] of [
      ["stores-to-attributes", "storeId", "store"],
      ["products-to-attributes", "productId", "product"],
      ["stores-to-products-to-attributes", "storesToProductsId", "offer"],
    ] as const) {
      const links = await this.find(relation, { attributeId });
      for (const link of links) {
        scopes.push({ type, id: String(link[column]) });
      }
    }
    return scopes;
  }

  protected async assertAttribute(
    subjectId: string,
    id: string,
    admin: boolean,
    allowUnlinked = false,
  ) {
    const owners = await this.attributeOwners(id);
    if (!owners.length && !allowUnlinked && !admin) {
      this.denied();
    }
    for (const owner of owners) {
      await this.assertOwner(subjectId, owner.type, owner.id, admin);
    }
  }

  protected async stockOffers(attributeId: string) {
    const keys = await this.find("attribute-keys-to-attributes", {
      attributeId,
    });
    for (const link of keys) {
      const key = await this.record(
        "attribute-keys",
        String(link.attributeKeyId),
      );
      if (key.slug === "stock_quantity") {
        const links = await this.find("stores-to-products-to-attributes", {
          attributeId,
        });
        return links.map((item) => String(item.storesToProductsId));
      }
    }
    return [];
  }

  protected stockValue(value: unknown): number {
    if (
      (typeof value !== "number" && typeof value !== "string") ||
      !/^(0|[1-9]\d*)$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value))
    ) {
      throw new Error(
        "Validation error. Stock must be an exact non-negative integer",
      );
    }
    return Number(value);
  }

  protected async assertStock(offerIds: string[], value: unknown) {
    const stock = this.stockValue(value);
    const reserved = await this.dependencies.stock.reservedQuantities({
      offerIds,
    });
    for (const offerId of offerIds) {
      if (stock < (reserved[offerId] ?? 0)) {
        throw new Error(
          "Validation error. Stock cannot be lower than outstanding reservations",
        );
      }
    }
  }

  protected async affectedOffers(props: IMutation, previous?: IRecord) {
    const data = { ...previous, ...props.data };
    if (props.entity === "stores-to-products") {
      return props.id ? [props.id] : [];
    }
    if (props.entity === "stores-to-products-to-attributes") {
      return [
        ...new Set(
          [previous?.storesToProductsId, data.storesToProductsId]
            .filter(Boolean)
            .map(String),
        ),
      ];
    }
    if (props.entity === "attributes" && props.id) {
      return this.stockOffers(props.id);
    }
    if (
      [
        "attribute-keys-to-attributes",
        "attributes-to-billing-module-currencies",
      ].includes(props.entity)
    ) {
      const ids = [
        ...new Set(
          [previous?.attributeId, data.attributeId].filter(Boolean).map(String),
        ),
      ];
      return (
        await Promise.all(
          ids.map(async (id) =>
            (
              await this.find("stores-to-products-to-attributes", {
                attributeId: id,
              })
            ).map((link) => String(link.storesToProductsId)),
          ),
        )
      ).flat();
    }
    if (props.entity === "attribute-keys" && props.id) {
      const links = await this.find("attribute-keys-to-attributes", {
        attributeKeyId: props.id,
      });
      return (
        await Promise.all(
          links.map((link) => this.stockOffers(String(link.attributeId))),
        )
      ).flat();
    }
    if (props.entity === "stores" && props.id) {
      return (await this.find("stores-to-products", { storeId: props.id })).map(
        (offer) => offer.id,
      );
    }
    if (props.entity === "products" && props.id) {
      return (
        await this.find("stores-to-products", { productId: props.id })
      ).map((offer) => offer.id);
    }
    return [];
  }

  protected async authorize(props: IMutation, previous?: IRecord) {
    const admin =
      props.operator ||
      Boolean(
        props.subjectId && (await this.dependencies.isAdmin(props.subjectId)),
      );
    const subjectId = props.subjectId ?? "";
    if (!admin && !subjectId) {
      this.denied();
    }
    const data = { ...previous, ...props.data };
    const creating = props.method === "POST";
    if (props.entity.startsWith("subjects-to-ecommerce-module-")) {
      if (!admin) {
        this.denied();
      }
      if (creating && data.variant === "owner" && !data.subjectId) {
        throw new Error("Validation error. An owner Subject is required");
      }
      return;
    }
    if (["stores", "products"].includes(props.entity)) {
      if (!creating) {
        await this.assertOwner(
          subjectId,
          props.entity === "stores" ? "store" : "product",
          props.id!,
          admin,
        );
      }
      if (props.entity === "products" && props.method === "DELETE" && !admin) {
        const offers = await this.find("stores-to-products", {
          productId: props.id,
        });
        for (const offer of offers) {
          await this.assertOwner(
            subjectId,
            "store",
            String(offer.storeId),
            false,
          );
        }
      }
      return;
    }
    if (props.entity === "attribute-keys") {
      if (!admin) {
        this.denied();
      }
      if (
        previous &&
        ["slug", "field", "type"].some(
          (field) =>
            props.data[field] !== undefined && data[field] !== previous[field],
        ) &&
        (
          await this.find("attribute-keys-to-attributes", {
            attributeKeyId: previous.id,
          })
        ).length
      ) {
        throw new Error(
          "Validation error. An in-use attribute key cannot change its meaning",
        );
      }
      return;
    }
    if (props.entity === "attributes") {
      if (creating && !admin) {
        throw new Error(
          "Permission error. Create catalogue attributes through the scoped seller operation",
        );
      }
      if (props.id) {
        await this.assertAttribute(subjectId, props.id, admin);
      }
      return;
    }
    if (props.entity === "stores-to-products") {
      const previousSettings = previous?.settings as
        IOffer["settings"] | undefined;
      const settings = data.settings as IOffer["settings"] | undefined;
      if (
        !admin &&
        (previousSettings?.initialGrant === true ||
          settings?.initialGrant === true ||
          previousSettings?.initialGrantLegacyHistory === true ||
          settings?.initialGrantLegacyHistory === true)
      ) {
        throw new Error(
          "Permission error. Registration grants require an administrator",
        );
      }
      for (const storeId of [
        ...new Set(
          [previous?.storeId, data.storeId].filter(Boolean).map(String),
        ),
      ]) {
        await this.assertOwner(subjectId, "store", storeId, admin);
      }
      if (!data.storeId || !data.productId) {
        throw new Error("Validation error. Offer endpoints are required");
      }
      if (
        previous &&
        (data.storeId !== previous.storeId ||
          data.productId !== previous.productId)
      ) {
        throw new Error(
          "Validation error. Offer endpoints cannot be reassigned",
        );
      }
      await this.record("products", String(data.productId));
      return;
    }
    if (props.entity === "offers-to-offers") {
      if (!data.sourceOfferId || !data.targetOfferId) {
        throw new Error(
          "Validation error. Service offer endpoints are required",
        );
      }
      for (const link of previous ? [previous, data] : [data]) {
        const source = await this.record(
          "stores-to-products",
          String(link.sourceOfferId),
        );
        if (link.variant === "fulfilled-by") {
          await this.assertOwner(subjectId, "offer", source.id, admin);
        } else {
          await this.assertOwner(
            subjectId,
            "product",
            String(source.productId),
            admin,
          );
        }
      }
      return;
    }
    for (const [relation, column, type] of [
      ["stores-to-attributes", "storeId", "store"],
      ["products-to-attributes", "productId", "product"],
      ["stores-to-products-to-attributes", "storesToProductsId", "offer"],
    ] as const) {
      if (props.entity !== relation) {
        continue;
      }
      for (const id of [
        ...new Set(
          [previous?.[column], data[column]].filter(Boolean).map(String),
        ),
      ]) {
        await this.assertOwner(subjectId, type, id, admin);
      }
      for (const id of [
        ...new Set(
          [previous?.attributeId, data.attributeId].filter(Boolean).map(String),
        ),
      ]) {
        await this.assertAttribute(subjectId, id, admin, creating);
      }
      if (!data[column] || !data.attributeId) {
        throw new Error(
          "Validation error. Catalogue attribute endpoints are required",
        );
      }
      return;
    }
    if (
      [
        "attribute-keys-to-attributes",
        "attributes-to-billing-module-currencies",
      ].includes(props.entity)
    ) {
      for (const id of [
        ...new Set(
          [previous?.attributeId, data.attributeId].filter(Boolean).map(String),
        ),
      ]) {
        await this.assertAttribute(subjectId, id, admin);
      }
      if (!data.attributeId) {
        throw new Error("Validation error. Attribute endpoint is required");
      }
      return;
    }
    throw new Error("Permission error. Unsupported catalogue mutation");
  }

  async mutate<T>(
    props: IMutation,
    operation: () => Promise<T>,
    createdRecord?: (result: T) => Promise<IRecord | undefined>,
  ): Promise<T> {
    const keys = [
      "ecommerce-catalog",
      props.entity,
      `${props.entity}:${props.id ?? "create"}`,
    ];
    return this.dependencies.repository.withCatalogLock(keys, async () => {
      const current = props.id
        ? await this.record(props.entity, props.id)
        : undefined;
      await this.authorize(props, current);
      if (props.expectedUpdatedAt) {
        const updatedAt = current?.updatedAt;
        const storedTime =
          typeof updatedAt === "string"
            ? Date.parse(updatedAt)
            : Number(updatedAt);
        if (storedTime !== Date.parse(props.expectedUpdatedAt)) {
          throw new Error("Conflict error. Store settings have changed");
        }
      }
      const offerIds = await this.affectedOffers(props, current);
      return this.dependencies.stock.withOfferLocks({ offerIds }, async () => {
        await this.validateStockMutation(props, current, offerIds);
        const result = await operation();
        const archiving =
          props.entity === "stores-to-products" &&
          props.method === "PATCH" &&
          props.data.variant === "hidden";
        if (!archiving) {
          await this.validateOfferStocks(offerIds);
        }
        if (
          props.method === "POST" &&
          ["stores", "products"].includes(props.entity) &&
          props.subjectId &&
          createdRecord
        ) {
          const created = await createdRecord(result);
          if (created) {
            await this.entity(
              `subjects-to-ecommerce-module-${props.entity}`,
            ).create({
              data: {
                subjectId: props.subjectId,
                [props.entity === "stores"
                  ? "ecommerceModuleStoreId"
                  : "ecommerceModuleProductId"]: created.id,
                variant: "owner",
              },
            });
          }
        }
        return result;
      });
    });
  }

  async mutateBatch<T>(
    mutations: IMutation[],
    operation: () => Promise<T>,
    createdRecords?: (result: T) => Promise<IRecord[]>,
  ): Promise<T> {
    return this.dependencies.repository.withCatalogLock(
      ["ecommerce-catalog"],
      async () => {
        const prepared: {
          mutation: IMutation;
          previous?: IRecord;
          offerIds: string[];
        }[] = [];
        for (const mutation of mutations) {
          const previous = mutation.id
            ? await this.record(mutation.entity, mutation.id)
            : undefined;
          await this.authorize(mutation, previous);
          prepared.push({
            mutation,
            previous,
            offerIds: await this.affectedOffers(mutation, previous),
          });
        }
        const offerIds = [
          ...new Set(prepared.flatMap((item) => item.offerIds)),
        ].sort();
        return this.dependencies.stock.withOfferLocks(
          { offerIds },
          async () => {
            for (const item of prepared) {
              await this.validateStockMutation(
                item.mutation,
                item.previous,
                item.offerIds,
              );
            }
            const result = await operation();
            for (const { mutation, previous } of prepared) {
              const settings = mutation.data.settings as
                IOffer["settings"] | undefined;
              const pricing = settings?.workTokenPricing;
              if (
                mutation.entity === "stores-to-products" &&
                mutation.method === "PATCH" &&
                mutation.id &&
                pricing &&
                pricing.multiplier === undefined &&
                !settings.closedForNewOrders &&
                mutation.data.variant !== "hidden"
              ) {
                const previousSettings = previous?.settings as
                  IOffer["settings"] | undefined;
                if (
                  previousSettings?.workTokenPricing?.currencyId !==
                    pricing.currencyId ||
                  previousSettings.workTokenPricing.multiplier !== undefined
                ) {
                  await this.validateWorkOffer(mutation.id);
                }
              }
            }
            const archived = new Set(
              mutations
                .filter(
                  (mutation) =>
                    mutation.entity === "stores-to-products" &&
                    mutation.method === "PATCH" &&
                    mutation.data.variant === "hidden",
                )
                .map((mutation) => mutation.id),
            );
            await this.validateOfferStocks(
              offerIds.filter((id) => !archived.has(id)),
            );
            const first = mutations[0];
            if (
              first?.method === "POST" &&
              first.subjectId &&
              ["stores", "products"].includes(first.entity) &&
              createdRecords
            ) {
              for (const record of await createdRecords(result)) {
                await this.entity(
                  `subjects-to-ecommerce-module-${first.entity}`,
                ).create({
                  data: {
                    subjectId: first.subjectId,
                    [first.entity === "stores"
                      ? "ecommerceModuleStoreId"
                      : "ecommerceModuleProductId"]: record.id,
                    variant: "owner",
                  },
                });
              }
            }
            return result;
          },
        );
      },
    );
  }

  async findOrCreate<T>(
    props: IMutation,
    operation: () => Promise<T>,
    createdRecord: (result: T) => Promise<IRecord | undefined>,
  ): Promise<T> {
    return this.dependencies.repository.withCatalogLock(
      ["ecommerce-catalog"],
      async () => {
        const records = await this.entity(props.entity).find({
          params: {
            filters: {
              and: Object.entries(props.data).map(([column, value]) => ({
                column,
                method: "eq",
                value: value as string,
              })),
            },
          },
        });
        if (records[0]) {
          return this.mutate(
            { ...props, method: "PATCH", id: records[0].id, data: {} },
            operation,
          );
        }
        return this.mutate(props, operation, createdRecord);
      },
    );
  }

  protected async validateOfferStocks(offerIds: string[]) {
    for (const offerId of [...new Set(offerIds)]) {
      const links = await this.find("stores-to-products-to-attributes", {
        storesToProductsId: offerId,
      });
      let stocks = 0;
      for (const link of links) {
        const attributeId = String(link.attributeId);
        const stockFor = await this.stockOffers(attributeId);
        if (!stockFor.length) {
          continue;
        }
        stocks += 1;
        const owners = await this.attributeOwners(attributeId);
        const currencies = await this.find(
          "attributes-to-billing-module-currencies",
          { attributeId },
        );
        if (stockFor.length !== 1 || owners.length !== 1 || currencies.length) {
          throw new Error(
            "Validation error. Stock must belong exclusively to one offer and has no currency",
          );
        }
        const attribute = await this.record("attributes", attributeId);
        await this.assertStock([offerId], attribute.number);
      }
      if (stocks > 1) {
        throw new Error("Validation error. An offer has only one stock value");
      }
    }
  }

  protected async validateStockMutation(
    props: IMutation,
    previous: IRecord | undefined,
    offerIds: string[],
  ) {
    const data = { ...previous, ...props.data };
    if (
      props.method === "DELETE" &&
      ["stores", "products", "stores-to-products"].includes(props.entity)
    ) {
      if (offerIds.length) {
        if (props.entity !== "products") {
          const productServices = await this.entity("offers-to-offers").find({
            params: {
              filters: {
                and: [
                  {
                    column: "sourceOfferId",
                    method: "inArray",
                    value: offerIds,
                  },
                  {
                    column: "variant",
                    method: "inArray",
                    value: ["delivery", "add-on"],
                  },
                ],
              },
              limit: 1,
            },
          });
          if (productServices.length) {
            throw new Error(
              "Conflict error. This offer defines product services. Archive the offer or remove those links before deletion",
            );
          }
        }
        const lines = await this.entity("orders-to-products").find({
          params: {
            filters: {
              and: [{ column: "offerId", method: "inArray", value: offerIds }],
            },
          },
        });
        const references = await this.entity(
          "orders-to-billing-module-payment-intents",
        ).find({
          params: {
            filters: {
              and: [{ column: "offerId", method: "inArray", value: offerIds }],
            },
          },
        });
        if (references.length || lines.length) {
          throw new Error(
            "Conflict error. Used offers must be archived by setting variant to hidden; purchase records remain available",
          );
        }
      }
      const held = await this.dependencies.stock.reservedQuantities({
        offerIds,
      });
      if (Object.values(held).some((quantity) => quantity > 0)) {
        throw new Error(
          "Validation error. Catalogue record has outstanding reservations",
        );
      }
    }
    const unlinking =
      previous &&
      ((props.entity === "stores-to-products-to-attributes" &&
        (data.attributeId !== previous.attributeId ||
          data.storesToProductsId !== previous.storesToProductsId)) ||
        (props.entity === "attribute-keys-to-attributes" &&
          (data.attributeId !== previous.attributeId ||
            data.attributeKeyId !== previous.attributeKeyId)));
    if (
      (props.method === "DELETE" || unlinking) &&
      [
        "attributes",
        "attribute-keys",
        "attribute-keys-to-attributes",
        "stores-to-products-to-attributes",
      ].includes(props.entity) &&
      offerIds.length
    ) {
      const held = await this.dependencies.stock.reservedQuantities({
        offerIds,
      });
      if (Object.values(held).some((quantity) => quantity > 0)) {
        throw new Error(
          "Validation error. Stock cannot be removed while reservations are outstanding",
        );
      }
    }
    if (
      props.entity === "attributes" &&
      props.method !== "DELETE" &&
      offerIds.length
    ) {
      await this.assertStock(offerIds, data.number);
    }
    if (
      props.entity === "attributes" &&
      props.id &&
      props.method !== "DELETE"
    ) {
      const links = await this.find("attribute-keys-to-attributes", {
        attributeId: props.id,
      });
      for (const link of links) {
        const key = await this.record(
          "attribute-keys",
          String(link.attributeKeyId),
        );
        if (key.slug === "price_formula") {
          const expression = (
            data.string as Record<string, unknown> | undefined
          )?.en;
          if (typeof expression !== "string") {
            throw new Error("Validation error. A Product formula is required");
          }
          const products = await this.find("products-to-attributes", {
            attributeId: props.id,
          });
          await this.validateProductFormula(
            expression,
            products.map(({ productId }) => String(productId)),
          );
        }
      }
    }
    if (
      props.entity === "stores-to-products-to-attributes" &&
      props.method !== "DELETE"
    ) {
      const stockOffers = await this.stockOffers(String(data.attributeId));
      const keys = await this.find("attribute-keys-to-attributes", {
        attributeId: data.attributeId,
      });
      const stockKey = (
        await Promise.all(
          keys.map((link) =>
            this.record("attribute-keys", String(link.attributeKeyId)),
          ),
        )
      ).some((key) => key.slug === "stock_quantity");
      if (stockKey) {
        if (stockOffers.some((id) => id !== data.storesToProductsId)) {
          throw new Error(
            "Validation error. Stock attributes cannot be shared between offers",
          );
        }
        const existing = await this.find("stores-to-products-to-attributes", {
          storesToProductsId: data.storesToProductsId,
        });
        for (const link of existing) {
          if (
            link.id !== props.id &&
            link.attributeId !== data.attributeId &&
            (await this.stockOffers(String(link.attributeId))).length
          ) {
            throw new Error(
              "Validation error. An offer has only one stock attribute",
            );
          }
        }
        const attribute = await this.record(
          "attributes",
          String(data.attributeId),
        );
        await this.assertStock(
          [String(data.storesToProductsId)],
          attribute.number,
        );
      }
    }
    if (
      props.entity === "attribute-keys-to-attributes" &&
      props.method !== "DELETE"
    ) {
      const key = await this.record(
        "attribute-keys",
        String(data.attributeKeyId),
      );
      if (key.slug === "stock_quantity") {
        if (key.field !== "number") {
          throw new Error(
            "Validation error. Stock key must use a numeric field",
          );
        }
        const links = await this.find("stores-to-products-to-attributes", {
          attributeId: data.attributeId,
        });
        if (links.length > 1) {
          throw new Error(
            "Validation error. Stock attributes cannot be shared between offers",
          );
        }
        const attribute = await this.record(
          "attributes",
          String(data.attributeId),
        );
        await this.assertStock(
          links.map((link) => String(link.storesToProductsId)),
          attribute.number,
        );
      }
    }
  }

  protected async writableStore(subjectId: string, requested?: string) {
    if (requested) {
      await this.assertOwner(subjectId, "store", requested);
      await this.record("stores", requested);
      return requested;
    }
    const grants = await this.find("subjects-to-ecommerce-module-stores", {
      subjectId,
      variant: "owner",
    });
    const ids = [
      ...new Set(grants.map((grant) => String(grant.ecommerceModuleStoreId))),
    ];
    if (ids.length !== 1) {
      throw new Error("Validation error. Choose a writable store explicitly");
    }
    return ids[0];
  }

  protected async key(slug: string, field: string, type: string) {
    const matches = await this.find("attribute-keys", { slug });
    if (
      matches.length > 1 ||
      (matches[0] && (matches[0].field !== field || matches[0].type !== type))
    ) {
      throw new Error(
        "Validation error. Attribute key configuration conflicts with this value",
      );
    }
    if (matches[0]) {
      return matches[0];
    }
    return this.entity("attribute-keys").create({
      data: { slug, field, type, title: { en: slug }, adminTitle: slug },
    });
  }

  protected async createAttribute(
    owner: { type: "store" | "product" | "offer"; id: string },
    slug: string,
    field: "number" | "string",
    type: string,
    value: string,
    currencyId?: string,
  ) {
    const key = await this.key(slug, field, type);
    if (currencyId) {
      await this.record("currencies", currencyId);
    }
    const attribute = await this.entity("attributes").create({
      data: {
        [field]: field === "string" ? { en: value } : value,
        adminTitle: slug,
      },
    });
    await this.entity("attribute-keys-to-attributes").create({
      data: { attributeId: attribute.id, attributeKeyId: key.id },
    });
    if (currencyId) {
      await this.entity("attributes-to-billing-module-currencies").create({
        data: {
          attributeId: attribute.id,
          billingModuleCurrencyId: currencyId,
        },
      });
    }
    const relation =
      owner.type === "offer"
        ? "stores-to-products-to-attributes"
        : `${owner.type}s-to-attributes`;
    const column =
      owner.type === "offer" ? "storesToProductsId" : `${owner.type}Id`;
    await this.entity(relation).create({
      data: { [column]: owner.id, attributeId: attribute.id },
    });
    return attribute;
  }

  createScopedPrice(
    owner: { type: "product" | "offer"; id: string },
    price: { currencyId: string; amount: string },
  ) {
    return this.createAttribute(
      owner,
      "price",
      "number",
      "price",
      price.amount,
      price.currencyId,
    );
  }

  async mutation(props: { subjectId: string; data: ICatalogMutationInput }) {
    const input = catalogMutationSchema.parse(props.data);
    const entitySchema = catalogEntitySchemas[input.entity];
    const values = { ...input.data };
    if (input.entity === "attributes") {
      for (const field of ["date", "datetime"]) {
        if (typeof values[field] === "string") {
          values[field] = new Date(values[field]);
        }
      }
    }
    if (input.entity === "products" && input.method === "PATCH") {
      delete values._expectedMetadata;
    }
    const parsed = (
      input.method === "PATCH" ? entitySchema.partial() : entitySchema
    )
      .strict()
      .safeParse(values);
    if (input.method !== "DELETE" && !parsed.success) {
      throw new Error("Validation error. Invalid catalogue record values");
    }
    const data: Record<string, unknown> =
      input.method === "DELETE" ? {} : parsed.data!;
    if (input.method === "PATCH") {
      for (const key of Object.keys(data)) {
        if (!Object.hasOwn(values, key)) {
          delete data[key];
        }
      }
      if (
        input.entity === "products" &&
        Object.hasOwn(input.data, "_expectedMetadata")
      ) {
        data._expectedMetadata = input.data._expectedMetadata;
      }
    }
    const entity = this.entity(input.entity);
    return this.mutate(
      {
        subjectId: props.subjectId,
        entity: input.entity,
        method: input.method,
        id: input.recordId,
        expectedUpdatedAt: input.expectedUpdatedAt,
        data,
      },
      async () => {
        if (input.method === "POST") {
          return entity.create({ data });
        }
        if (input.method === "PATCH") {
          return entity.update({ id: input.recordId!, data });
        }
        if (!entity.delete) {
          throw new Error(
            "Configuration error. Catalogue entity cannot be deleted",
          );
        }
        return entity.delete({ id: input.recordId! });
      },
      async (record) => record,
    );
  }

  async createOffer(props: {
    subjectId: string;
    data: ICatalogCreateOfferInput;
    attachProductRelations?: (
      result: ICatalogCreateOfferResult,
    ) => Promise<void>;
  }): Promise<ICatalogCreateOfferResult> {
    const input = catalogCreateOfferSchema.parse(props.data);
    if (
      (input.settings?.initialGrant ||
        input.settings?.initialGrantLegacyHistory) &&
      !(await this.dependencies.isAdmin(props.subjectId))
    ) {
      throw new Error(
        "Permission error. Registration grants require an administrator",
      );
    }
    return this.dependencies.repository.withCatalogLock(
      [
        "ecommerce-catalog",
        "attribute-keys",
        "subjects-to-ecommerce-module-stores",
        `subject:${props.subjectId}`,
      ],
      async () => {
        const storeId = await this.writableStore(
          props.subjectId,
          input.storeId,
        );
        let product: IRecord;
        if (input.productId) {
          product = await this.record("products", input.productId);
        } else {
          const { formula, formulaVersion, ...data } = input.product!;
          compileTariffFormula(formula);
          product = await this.entity("products").create({ data });
          await this.entity("subjects-to-ecommerce-module-products").create({
            data: {
              subjectId: props.subjectId,
              ecommerceModuleProductId: product.id,
              variant: "owner",
            },
          });
          await this.createAttribute(
            { type: "product", id: product.id },
            "price_formula",
            "string",
            "feature",
            formula,
          );
          await this.createAttribute(
            { type: "product", id: product.id },
            "formula_version",
            "string",
            "feature",
            formulaVersion,
          );
        }
        const offer = await this.entity("stores-to-products").create({
          data: {
            storeId,
            productId: product.id,
            variant: input.variant,
            configurationKey: input.configurationKey,
            settings: input.settings,
            sku: randomUUID(),
          },
        });
        for (const price of input.prices) {
          await this.createAttribute(
            { type: "offer", id: offer.id },
            "price",
            "number",
            "price",
            price.amount,
            price.currencyId,
          );
        }
        if (input.stockQuantity != null) {
          await this.createAttribute(
            { type: "offer", id: offer.id },
            "stock_quantity",
            "number",
            "feature",
            String(input.stockQuantity),
          );
        }
        if (
          input.settings?.workTokenPricing?.multiplier === undefined &&
          input.settings?.workTokenPricing
        ) {
          await this.validateWorkOffer(offer.id);
        }
        const result = {
          product,
          offer,
        } as unknown as ICatalogCreateOfferResult;
        await props.attachProductRelations?.(result);
        return result;
      },
    );
  }

  async setAttribute(props: {
    subjectId: string;
    data: ICatalogSetAttributeInput;
  }) {
    const input = catalogSetAttributeSchema.parse(props.data);
    return this.dependencies.repository.withCatalogLock(
      [
        "ecommerce-catalog",
        "attribute-keys",
        `${input.owner.type}:${input.owner.id}`,
      ],
      async () => {
        await this.assertOwner(
          props.subjectId,
          input.owner.type,
          input.owner.id,
        );
        const offerIds = input.owner.type === "offer" ? [input.owner.id] : [];
        return this.dependencies.stock.withOfferLocks(
          { offerIds },
          async () => {
            if (input.key === "stock_quantity") {
              if (
                input.owner.type !== "offer" ||
                input.field !== "number" ||
                input.currencyId
              ) {
                throw new Error(
                  "Validation error. Stock belongs to exactly one offer and has no currency",
                );
              }
              await this.assertStock(offerIds, input.number);
            }
            if (input.key === "price_formula") {
              if (input.owner.type !== "product" || input.field !== "string") {
                throw new Error(
                  "Validation error. A price formula belongs to the shared Product",
                );
              }
              await this.validateProductFormula(input.string!, [
                input.owner.id,
              ]);
            }
            const relation =
              input.owner.type === "offer"
                ? "stores-to-products-to-attributes"
                : `${input.owner.type}s-to-attributes`;
            const column =
              input.owner.type === "offer"
                ? "storesToProductsId"
                : `${input.owner.type}Id`;
            const links = await this.find(relation, {
              [column]: input.owner.id,
            });
            let match: IRecord | undefined;
            for (const link of links) {
              const keyLinks = await this.find("attribute-keys-to-attributes", {
                attributeId: link.attributeId,
              });
              const matchingKey = (
                await Promise.all(
                  keyLinks.map((key) =>
                    this.record("attribute-keys", String(key.attributeKeyId)),
                  ),
                )
              ).some(
                (key) =>
                  key.slug === input.key &&
                  key.field === input.field &&
                  key.type === input.type,
              );
              if (!matchingKey) {
                continue;
              }
              const currencies = await this.find(
                "attributes-to-billing-module-currencies",
                { attributeId: link.attributeId },
              );
              if (
                input.currencyId
                  ? currencies.length === 1 &&
                    currencies[0].billingModuleCurrencyId === input.currencyId
                  : currencies.length === 0
              ) {
                if (match) {
                  throw new Error(
                    "Validation error. Ambiguous catalogue attribute",
                  );
                }
                match = await this.record(
                  "attributes",
                  String(link.attributeId),
                );
              }
            }
            const value =
              input.field === "number" ? String(input.number) : input.string!;
            if (!match) {
              const created = await this.createAttribute(
                input.owner,
                input.key,
                input.field,
                input.type,
                value,
                input.currencyId,
              );
              await this.validateOfferStocks(offerIds);
              return created;
            }
            await this.assertAttribute(
              props.subjectId,
              match.id,
              await this.dependencies.isAdmin(props.subjectId),
            );
            const updated = await this.entity("attributes").update({
              id: match.id,
              data: {
                [input.field]: input.field === "string" ? { en: value } : value,
              },
            });
            await this.validateOfferStocks(offerIds);
            return updated;
          },
        );
      },
    );
  }
}
