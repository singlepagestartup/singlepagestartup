import { getHttpErrorType, logger } from "@sps/backend-utils";
import type { IModel as ICurrency } from "@sps/billing/models/currency/sdk/model";
import type { IModel as IAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IOfferAttribute } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service/singlepage/catalog";
import type { IModel as IOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import {
  storeProductCreateOfferSchema,
  type IStoreProductCreateOfferInput,
  storeProductOfferVariants,
  storeProductUpdateSchema,
  type IStoreProduct,
  type IStoreProductDetail,
  type IStoreProductList,
  type IStoreProductOffer,
  type IStoreProductOrder,
  type IStoreProductPrice,
  type IStoreProductUpdate,
  type TStoreProductRelation,
} from "@sps/rbac/models/subject/sdk/model";
import { STORE_PRODUCT_CREATE_MAX_IMAGES } from "@sps/shared-utils";
import { consistencyContext } from "@sps/shared-backend-api";
import type { Service as Subject } from "../../../index";
import { criteria } from "../../customer-work/utils";
import { Relations } from "./relations";

const pageSize = 20;

interface IProductScope {
  storeId: string;
  productId: string;
}

interface IPriceOwner {
  type: "offer" | "product";
  id: string;
}

type TAttributeValue = Partial<Pick<IAttribute, "number" | "string">>;

export class Service {
  constructor(private readonly subject: Subject) {}

  private async storeAccess(subjectId: string, storeId: string) {
    const store = await this.subject.modules.ecommerce.store.findById({
      id: storeId,
    });
    const [access] = store
      ? await this.subject.crmWorkspace.stores(subjectId, store.slug)
      : [];
    if (!access || access.id !== storeId) {
      throw new Error("Permission error. Store catalog access is required");
    }
    return access;
  }

  private async canOwn(
    subjectId: string,
    kind: "store" | "product" | "offer",
    id: string,
  ) {
    try {
      await this.subject.ecommerceCatalog.assertOwner(subjectId, kind, id);
      return true;
    } catch (error) {
      if (getHttpErrorType(error).status !== 403) {
        throw error;
      }
      return false;
    }
  }

  private productSummary(
    product: IProduct,
    offers: IStoreProductOffer[],
    productPrices: IStoreProductPrice[],
  ): IStoreProduct {
    const {
      id,
      slug,
      title,
      adminTitle,
      shortDescription,
      description,
      kind,
      type,
      updatedAt,
    } = product;
    return {
      product: {
        id,
        slug,
        title,
        adminTitle,
        shortDescription,
        description,
        kind,
        type,
        updatedAt: updatedAt.toISOString(),
      },
      offers,
      productPrices,
    };
  }

  private prices(
    attributes: IOfferAttribute[],
    currencies: Map<string, ICurrency>,
    editable: boolean,
  ) {
    const priceAttributes = attributes.filter(({ type }) => type === "price");
    const prices = new Map<string, IStoreProductPrice>();
    for (const attribute of priceAttributes) {
      const [currencyId] = attribute.currencyIds;
      const currency = currencies.get(currencyId);
      if (
        attribute.currencyIds.length !== 1 ||
        !currency ||
        attribute.field !== "number" ||
        attribute.number === null
      ) {
        continue;
      }
      const currencyPrices = priceAttributes.filter(
        (price) =>
          price.currencyIds.length === 1 && price.currencyIds[0] === currencyId,
      );
      const attributeUses = attributes.filter(({ id }) => id === attribute.id);
      prices.set(`${attribute.id}:${currencyId}`, {
        attributeId: attribute.id,
        currencyId,
        currencyTitle: currency.title,
        currencySymbol: currency.symbol,
        amount: attribute.number,
        editable:
          editable &&
          currencyPrices.length === 1 &&
          attributeUses.length === 1 &&
          /^(0|[1-9]\d*)(\.\d{1,8})?$/.test(attribute.number),
      });
    }
    return [...prices.values()];
  }

  private async offerSummaries(
    offers: IOffer[],
    editableOffers = new Set<string>(),
    editableProductId?: string,
  ) {
    const grouped = new Map<string, IStoreProductOffer[]>();
    const productPrices = new Map<string, IStoreProductPrice[]>();
    if (!offers.length) {
      return { grouped, productPrices };
    }
    const ecommerce = this.subject.modules.ecommerce;
    const catalog = await ecommerce.storesToProducts.catalog.catalog(
      offers.map(({ id }) => id),
    );
    const currencies = new Map(
      catalog.currencies.map((currency) => [currency.id, currency]),
    );
    for (const { id, sku, variant, configurationKey, productId } of offers) {
      const editable = editableOffers.has(id);
      const prices = this.prices(
        catalog.offerAttributes.get(id) ?? [],
        currencies,
        editable,
      );
      const summaries = grouped.get(productId) ?? [];
      summaries.push({ id, sku, variant, configurationKey, editable, prices });
      grouped.set(productId, summaries);
      if (!productPrices.has(productId)) {
        productPrices.set(
          productId,
          this.prices(
            catalog.productAttributes.get(productId) ?? [],
            currencies,
            editableProductId === productId,
          ),
        );
      }
    }
    return { grouped, productPrices };
  }

  async list(
    subjectId: string,
    storeId: string,
    offset: number,
    limit = pageSize,
    search?: string,
  ): Promise<IStoreProductList> {
    const access = await this.storeAccess(subjectId, storeId);
    const offerVariants = storeProductOfferVariants(access.canReadCosts);
    const { items: page, total } =
      await this.subject.repository.storeCatalogProducts({
        storeId,
        offerVariants,
        offset,
        limit,
        search,
      });
    if (!page.length) {
      return { items: [], total };
    }
    const offers = await this.subject.modules.ecommerce.storesToProducts.find({
      params: {
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            {
              column: "productId",
              method: "inArray",
              value: page.map(({ id }) => id),
            },
            { column: "variant", method: "inArray", value: offerVariants },
          ],
        },
        orderBy: { and: [{ column: "id", method: "asc" }] },
      },
    });
    const { grouped, productPrices } = await this.offerSummaries(offers);
    return {
      items: page.map((product) =>
        this.productSummary(
          product,
          grouped.get(product.id) ?? [],
          productPrices.get(product.id) ?? [],
        ),
      ),
      total,
      nextOffset: offset + limit < total ? offset + limit : undefined,
    };
  }

  private async relatedOrders(scope: IProductScope, offset: number) {
    const orders = await this.subject.repository.storeCatalogProductOrders({
      ...scope,
      offset,
      limit: pageSize + 1,
    });
    const page = orders.slice(0, pageSize);
    return {
      items: page.map(({ createdAt, ...order }): IStoreProductOrder => ({
        ...order,
        createdAt: createdAt.toISOString(),
      })),
      nextOffset: orders.length > pageSize ? offset + pageSize : undefined,
    };
  }

  async detail(
    subjectId: string,
    scope: IProductScope,
    ordersOffset?: number,
    includeRelations = false,
  ): Promise<IStoreProductDetail> {
    const access = await this.storeAccess(subjectId, scope.storeId);
    const ecommerce = this.subject.modules.ecommerce;
    const allOffers = await ecommerce.storesToProducts.find({
      ...criteria({ productId: scope.productId }),
      params: {
        ...criteria({ productId: scope.productId }).params,
        orderBy: { and: [{ column: "id", method: "asc" }] },
      },
    });
    const offerVariants = storeProductOfferVariants(access.canReadCosts);
    const offers = allOffers.filter(
      ({ storeId, variant }) =>
        storeId === scope.storeId && offerVariants.includes(variant),
    );
    const product = offers.length
      ? await ecommerce.product.findById({ id: scope.productId })
      : null;
    if (!product) {
      throw new Error("Not Found error. Product is unavailable in this store");
    }
    const canEdit =
      access.canManageCatalog &&
      (await this.canOwn(subjectId, "store", scope.storeId));
    const sharedProduct = allOffers.some(
      ({ storeId }) => storeId !== scope.storeId,
    );
    const canEditProduct =
      canEdit &&
      !sharedProduct &&
      (await this.canEditStoreProduct(subjectId, product.id, allOffers));
    const editableOffers = new Set<string>();
    if (canEdit) {
      const permissions = await Promise.all(
        offers.map(({ id }) => this.canOwn(subjectId, "offer", id)),
      );
      for (const [index, offer] of offers.entries()) {
        if (permissions[index]) {
          editableOffers.add(offer.id);
        }
      }
    }
    const canReadRelatedWork =
      ordersOffset !== undefined && access.canManageTasks;
    const [{ grouped, productPrices }, orders, relations, funnels] =
      await Promise.all([
        this.offerSummaries(
          offers,
          editableOffers,
          canEditProduct ? product.id : undefined,
        ),
        canReadRelatedWork
          ? this.relatedOrders(scope, ordersOffset)
          : undefined,
        includeRelations
          ? new Relations(this.subject).read(
              product.id,
              offers,
              canEditProduct,
              editableOffers,
            )
          : undefined,
        canReadRelatedWork
          ? this.subject.crmWorkspace.productFunnels(subjectId, {
              ...scope,
              offerIds: allOffers
                .filter(({ storeId }) => storeId === scope.storeId)
                .map(({ id }) => id),
            })
          : undefined,
      ]);
    return {
      ...this.productSummary(
        product,
        grouped.get(product.id) ?? [],
        productPrices.get(product.id) ?? [],
      ),
      canEditProduct,
      sharedProduct,
      orders,
      funnels,
      relations,
    };
  }

  private async canEditStoreProduct(
    subjectId: string,
    productId: string,
    offers: IOffer[],
  ) {
    if (await this.canOwn(subjectId, "product", productId)) {
      return true;
    }
    if (
      offers.some(
        ({ settings }) =>
          settings.initialGrant || settings.initialGrantLegacyHistory,
      )
    ) {
      return false;
    }
    // Older single-store products have no separate product owner grant.
    const grants =
      await this.subject.module.subjectsToEcommerceModuleProducts.find(
        criteria({ ecommerceModuleProductId: productId, variant: "owner" }),
      );
    return grants.length === 0;
  }

  private async updateAttributeValue(
    owner: IPriceOwner,
    attributeId: string,
    value: TAttributeValue,
  ) {
    const ecommerce = this.subject.modules.ecommerce;
    const [offers, products, stores] = await Promise.all([
      ecommerce.storesToProductsToAttributes.find(criteria({ attributeId })),
      ecommerce.productsToAttributes.find(criteria({ attributeId })),
      ecommerce.storesToAttributes.find(criteria({ attributeId })),
    ]);
    const matches =
      owner.type === "offer"
        ? offers.filter(
            ({ storesToProductsId }) => storesToProductsId === owner.id,
          )
        : products.filter(({ productId }) => productId === owner.id);
    if (matches.length !== 1) {
      throw new Error("Conflict error. The attribute changed");
    }
    if (offers.length + products.length + stores.length === 1) {
      const updated = await ecommerce.attribute.update({
        id: attributeId,
        data: value,
      });
      if (!updated) {
        throw new Error("Conflict error. The attribute changed");
      }
      return;
    }
    const [original, keys, currencies] = await Promise.all([
      ecommerce.attribute.findById({ id: attributeId }),
      ecommerce.attributeKeysToAttributes.find(criteria({ attributeId })),
      ecommerce.attributesToBillingModuleCurrencies.find(
        criteria({ attributeId }),
      ),
    ]);
    if (!original || keys.length !== 1 || currencies.length > 1) {
      throw new Error("Conflict error. The attribute changed");
    }
    const { id, slug, createdAt, updatedAt, ...data } = original;
    const copy = await ecommerce.attribute.create({
      data: { ...data, ...value },
    });
    await ecommerce.attributeKeysToAttributes.create({
      data: { attributeId: copy.id, attributeKeyId: keys[0].attributeKeyId },
    });
    if (currencies[0]) {
      await ecommerce.attributesToBillingModuleCurrencies.create({
        data: {
          attributeId: copy.id,
          billingModuleCurrencyId: currencies[0].billingModuleCurrencyId,
        },
      });
    }
    const associations =
      owner.type === "offer"
        ? ecommerce.storesToProductsToAttributes
        : ecommerce.productsToAttributes;
    const updated = await associations.update({
      id: matches[0].id,
      data: { attributeId: copy.id },
    });
    if (!updated) {
      throw new Error("Conflict error. The attribute changed");
    }
  }

  private async addPrices(
    owner: IPriceOwner,
    offers: IStoreProductOffer[],
    prices: { currencyId: string; amount: string }[],
  ) {
    if (!prices.length) {
      return;
    }
    const catalog =
      await this.subject.modules.ecommerce.storesToProducts.catalog.catalog(
        offers.map(({ id }) => id),
      );
    const attributes =
      owner.type === "offer"
        ? catalog.offerAttributes
        : catalog.productAttributes;
    const existing = new Set(
      (attributes.get(owner.id) ?? [])
        .filter(({ type }) => type === "price")
        .flatMap(({ currencyIds }) => currencyIds),
    );
    for (const price of prices) {
      if (existing.has(price.currencyId)) {
        throw new Error(
          "Conflict error. A price already exists in that currency",
        );
      }
      await this.subject.ecommerceCatalog.createScopedPrice(owner, price);
    }
  }

  private async removePrice(
    owner: IPriceOwner,
    prices: IStoreProductPrice[],
    change: Extract<TStoreProductRelation, { kind: "remove-price" }>,
  ) {
    const price = prices.find(
      ({ attributeId, currencyId }) =>
        attributeId === change.attributeId && currencyId === change.currencyId,
    );
    if (!price?.editable || price.amount !== change.expectedAmount) {
      throw new Error(
        "Conflict error. The price changed. Reload it before saving",
      );
    }
    if (!prices.some((entry) => entry !== price && entry.editable)) {
      throw new Error("Validation error. Retain at least one price");
    }
    const ecommerce = this.subject.modules.ecommerce;
    const association =
      owner.type === "offer"
        ? ecommerce.storesToProductsToAttributes
        : ecommerce.productsToAttributes;
    const ownerColumn =
      owner.type === "offer" ? "storesToProductsId" : "productId";
    const [link] = await association.find(
      criteria({ [ownerColumn]: owner.id, attributeId: price.attributeId }),
    );
    if (!link) {
      throw new Error(
        "Conflict error. The price changed. Reload it before saving",
      );
    }
    await association.delete({ id: link.id });
  }

  private async updateTranslations(
    product: IStoreProduct["product"],
    changes: NonNullable<IStoreProductUpdate["translations"]>,
  ) {
    if (product.updatedAt !== changes.expectedUpdatedAt) {
      throw new Error(
        "Conflict error. The product changed. Reload it before saving",
      );
    }
    const data: Partial<
      Pick<IProduct, "title" | "shortDescription" | "description">
    > = {};
    for (const [language, values] of Object.entries(changes.entries)) {
      for (const field of [
        "title",
        "shortDescription",
        "description",
      ] as const) {
        if (values[field] !== undefined) {
          data[field] = {
            ...(data[field] ?? product[field]),
            [language]: values[field],
          };
        }
      }
    }
    if (
      data.title &&
      !Object.values(data.title).some((title) => title?.trim())
    ) {
      throw new Error("Validation error. Keep at least one product name");
    }
    const updated = await this.subject.modules.ecommerce.product.update({
      id: product.id,
      data,
    });
    if (!updated) {
      throw new Error("Conflict error. The product changed");
    }
  }

  private async attachOfferAttributes(
    storeId: string,
    offerId: string,
    attributeIds: string[],
    canReadCosts: boolean,
  ) {
    if (!attributeIds.length) {
      return;
    }
    const available = await this.subject.storeCatalogDirectories.findAttributes(
      storeId,
      attributeIds,
      canReadCosts,
    );
    const ids = new Set(available.map(({ id }) => id));
    if (attributeIds.some((id) => !ids.has(id))) {
      throw new Error(
        "Not Found error. Attribute is unavailable for assignment",
      );
    }
    const links = this.subject.modules.ecommerce.storesToProductsToAttributes;
    const existing = await links.find(
      criteria({ storesToProductsId: offerId }),
    );
    const linked = new Set(existing.map(({ attributeId }) => attributeId));
    for (const attributeId of attributeIds) {
      if (!linked.has(attributeId)) {
        await links.create({
          data: { storesToProductsId: offerId, attributeId },
        });
      }
    }
  }

  async createOffer(
    subjectId: string,
    input: IStoreProductCreateOfferInput,
    images: File[] = [],
  ) {
    const {
      categoryIds = [],
      attributeIds = [],
      ...data
    } = storeProductCreateOfferSchema.parse(input);
    if (!categoryIds.length && !attributeIds.length && !images.length) {
      return this.subject.ecommerceCatalog.createOffer({ subjectId, data });
    }
    if (
      (!data.product && (categoryIds.length || images.length)) ||
      images.length > STORE_PRODUCT_CREATE_MAX_IMAGES
    ) {
      throw new Error("Validation error. Invalid new product selection");
    }
    return this.subject.ecommerceCatalog.createOffer({
      subjectId,
      data,
      attachProductRelations: async ({ product, offer }) => {
        const access = await this.storeAccess(subjectId, offer.storeId);
        if (!access.canManageCatalog) {
          throw new Error(
            "Permission error. Store catalog management is required",
          );
        }
        await this.attachOfferAttributes(
          offer.storeId,
          offer.id,
          attributeIds,
          access.canReadCosts,
        );
        const relations = new Relations(this.subject);
        for (const categoryId of categoryIds) {
          await relations.attachCategory(product.id, categoryId);
        }
        for (const file of images) {
          const stored =
            await this.subject.modules.fileStorage.file.storePublicImage(file);
          consistencyContext.getStore()?.rollbackEffects?.push(stored.discard);
          await relations.attachImage(product.id, stored.entity.id);
        }
      },
    });
  }

  async uploadImage(subjectId: string, scope: IProductScope, file: File) {
    let discard: (() => Promise<void>) | undefined;
    try {
      const result = await this.subject.repository.withCatalogLock(
        ["ecommerce-catalog"],
        async () => {
          const current = await this.detail(subjectId, scope);
          if (!current.canEditProduct) {
            throw new Error(
              "Permission error. Product images cannot be edited for this store",
            );
          }
          const stored =
            await this.subject.modules.fileStorage.file.storePublicImage(file);
          discard = stored.discard;
          await new Relations(this.subject).attachImage(
            scope.productId,
            stored.entity.id,
          );
          return this.detail(subjectId, scope, undefined, true);
        },
      );
      return result;
    } catch (error) {
      await discard?.().catch((cleanupError) => {
        logger.error(
          "Failed to discard a product image after its product association could not be saved",
          cleanupError,
        );
      });
      throw error;
    }
  }

  async update(
    subjectId: string,
    scope: IProductScope,
    input: IStoreProductUpdate,
    includeRelations = false,
  ): Promise<IStoreProductDetail> {
    const changes = storeProductUpdateSchema.parse(input);
    const ecommerce = this.subject.modules.ecommerce;
    const { stock } = this.subject.ecommerceCatalog.dependencies;
    return this.subject.repository.withCatalogLock(
      ["ecommerce-catalog"],
      async () => {
        const current = await this.detail(subjectId, scope);
        const offer =
          changes.offer &&
          current.offers.find(({ id }) => id === changes.offer?.id);
        const relation = changes.relation;
        const relationOfferId =
          relation && "offerId" in relation ? relation.offerId : undefined;
        const relationOffer = relationOfferId
          ? current.offers.find(({ id }) => id === relationOfferId)
          : undefined;
        const productCommerce =
          changes.productPrices.length > 0 ||
          changes.productNewPrices.length > 0 ||
          (relation?.kind === "remove-price" && relation.owner === "product");
        if (
          (changes.product ||
            changes.translations ||
            productCommerce ||
            (relation && !relationOfferId)) &&
          !current.canEditProduct
        ) {
          throw new Error(
            "Permission error. This product's description cannot be edited for this store",
          );
        }
        if (
          (changes.offer && !offer?.editable) ||
          (relationOfferId && !relationOffer?.editable)
        ) {
          throw new Error(
            "Permission error. This offer cannot be edited for this store",
          );
        }
        const offerIds =
          productCommerce || (relation && !relationOfferId)
            ? current.offers.map(({ id }) => id)
            : [offer?.id, relationOffer?.id].filter((id) => id !== undefined);
        return stock.withOfferLocks({ offerIds }, async () => {
          if (changes.product) {
            const {
              expectedUpdatedAt,
              language,
              title,
              shortDescription,
              description,
            } = changes.product;
            await this.updateTranslations(current.product, {
              expectedUpdatedAt,
              entries: { [language]: { title, shortDescription, description } },
            });
          }
          if (changes.translations) {
            await this.updateTranslations(
              current.product,
              changes.translations,
            );
          }
          const productOwner: IPriceOwner = {
            type: "product",
            id: current.product.id,
          };
          for (const price of changes.productPrices) {
            const existing = current.productPrices.find(
              ({ attributeId, currencyId }) =>
                attributeId === price.attributeId &&
                currencyId === price.currencyId,
            );
            if (
              !existing?.editable ||
              existing.amount !== price.expectedAmount
            ) {
              throw new Error(
                "Conflict error. The price changed. Reload it before saving",
              );
            }
            await this.updateAttributeValue(
              productOwner,
              existing.attributeId,
              { number: price.amount },
            );
          }
          await this.addPrices(
            productOwner,
            current.offers,
            changes.productNewPrices,
          );
          if (changes.offer && offer) {
            const { sku, prices, newPrices } = changes.offer;
            const offerOwner: IPriceOwner = { type: "offer", id: offer.id };
            if (sku) {
              if (sku.expected !== offer.sku) {
                throw new Error(
                  "Conflict error. The SKU changed. Reload it before saving",
                );
              }
              const [used] = await ecommerce.storesToProducts.find(
                criteria({ sku: sku.value }),
              );
              if (used && used.id !== offer.id) {
                throw new Error("Conflict error. The SKU is already in use");
              }
              const updated = await ecommerce.storesToProducts.update({
                id: offer.id,
                data: { sku: sku.value },
              });
              if (!updated) {
                throw new Error("Conflict error. The offer changed");
              }
            }
            for (const price of prices) {
              const existing = offer.prices.find(
                ({ attributeId, currencyId }) =>
                  attributeId === price.attributeId &&
                  currencyId === price.currencyId,
              );
              if (
                !existing?.editable ||
                existing.amount !== price.expectedAmount
              ) {
                throw new Error(
                  "Conflict error. The price changed. Reload it before saving",
                );
              }
              await this.updateAttributeValue(
                offerOwner,
                existing.attributeId,
                { number: price.amount },
              );
            }
            await this.addPrices(offerOwner, [offer], newPrices);
          }
          if (relation?.kind === "remove-price") {
            if (relationOffer) {
              await this.removePrice(
                { type: "offer", id: relationOffer.id },
                relationOffer.prices,
                relation,
              );
            } else {
              await this.removePrice(
                productOwner,
                current.productPrices,
                relation,
              );
            }
          } else if (relation?.kind === "attach-attribute") {
            const access = await this.storeAccess(subjectId, scope.storeId);
            await this.attachOfferAttributes(
              scope.storeId,
              relation.offerId,
              [relation.attributeId],
              access.canReadCosts,
            );
          } else if (relation) {
            const owner = relationOffer
              ? { type: "offer" as const, id: relationOffer.id }
              : productOwner;
            await new Relations(this.subject).update(
              current.product.id,
              relation,
              (id, value) => this.updateAttributeValue(owner, id, value),
            );
          }
          return this.detail(subjectId, scope, undefined, includeRelations);
        });
      },
    );
  }
}
