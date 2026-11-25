import { getHttpErrorType } from "@sps/backend-utils";
import {
  storeCatalogDirectoryCreateSchema,
  storeCatalogDirectoryUpdateSchema,
  type IStoreCatalogDirectoryUpdate,
  type IStoreCatalogDirectoryDetail,
  type IStoreCatalogDirectoryCreate,
  type IStoreCatalogDirectoryItem,
  type IStoreCatalogDirectoryPage,
  type TStoreCatalogDirectoryKind,
} from "@sps/rbac/models/subject/sdk/model/src/lib/store-catalog-directories";
import type { Service as Subject } from "../../index";
import { criteria } from "../customer-work/utils";

export class Service {
  constructor(private readonly subject: Subject) {}

  private async access(subjectId: string, storeId: string) {
    const store = await this.subject.modules.ecommerce.store.findById({
      id: storeId,
    });
    const [access] = store
      ? await this.subject.crmWorkspace.stores(subjectId, store.slug)
      : [];
    if (access?.id !== storeId) {
      throw new Error("Permission error. Store catalog access is required");
    }
    return access;
  }

  private async canCreate(
    subjectId: string,
    storeId: string,
    canManageCatalog: boolean,
  ) {
    if (!canManageCatalog) {
      return false;
    }
    try {
      await this.subject.ecommerceCatalog.assertOwner(
        subjectId,
        "store",
        storeId,
      );
      return true;
    } catch (error) {
      if (getHttpErrorType(error).status === 403) {
        return false;
      }
      throw error;
    }
  }

  async list(
    subjectId: string,
    storeId: string,
    kind: TStoreCatalogDirectoryKind,
    params: { offset: number; limit: number; search?: string },
  ): Promise<IStoreCatalogDirectoryPage> {
    const access = await this.access(subjectId, storeId);
    const [{ items, total }, canCreate] = await Promise.all([
      this.subject.repository.storeCatalogDirectory({
        ...params,
        kind,
        storeId,
        canReadCosts: access.canReadCosts,
      }),
      this.canCreate(subjectId, storeId, access.canManageCatalog),
    ]);
    const nextOffset = params.offset + items.length;
    return {
      items,
      total,
      canCreate,
      nextOffset: nextOffset < total ? nextOffset : undefined,
    };
  }

  private async localAttribute(
    subjectId: string,
    storeId: string,
    attributeId: string,
  ) {
    const ecommerce = this.subject.modules.ecommerce;
    const [stores, products, offers] = await Promise.all([
      ecommerce.storesToAttributes.find(criteria({ attributeId })),
      ecommerce.productsToAttributes.find(criteria({ attributeId })),
      ecommerce.storesToProductsToAttributes.find(criteria({ attributeId })),
    ]);
    if (stores.some((store) => store.storeId !== storeId)) {
      return false;
    }
    const productIds = [...new Set(products.map((link) => link.productId))];
    const offerIds = [
      ...new Set(offers.map((link) => link.storesToProductsId)),
    ];
    const offerFilter = (column: string, ids: string[]) =>
      ecommerce.storesToProducts.find({
        params: {
          filters: { and: [{ column, method: "inArray", value: ids }] },
        },
      });
    const [productOffers, directOffers] = await Promise.all([
      productIds.length ? offerFilter("productId", productIds) : [],
      offerIds.length ? offerFilter("id", offerIds) : [],
    ]);
    if (productIds.length && !(await this.subject.isAdmin(subjectId))) {
      const owners =
        await this.subject.module.subjectsToEcommerceModuleProducts.find({
          params: {
            filters: {
              and: [
                { column: "variant", method: "eq", value: "owner" },
                {
                  column: "ecommerceModuleProductId",
                  method: "inArray",
                  value: productIds,
                },
              ],
            },
          },
        });
      if (owners.some((owner) => owner.subjectId !== subjectId)) {
        return false;
      }
    }
    return (
      stores.length + productIds.length + offerIds.length > 0 &&
      productIds.length ===
        new Set(productOffers.map((offer) => offer.productId)).size &&
      offerIds.length === directOffers.length &&
      [...productOffers, ...directOffers].every(
        (offer) =>
          offer.storeId === storeId &&
          !offer.settings.initialGrant &&
          !offer.settings.initialGrantLegacyHistory,
      )
    );
  }

  private async canEditShared(
    subjectId: string,
    kind: "categories" | "attribute-keys",
    id: string,
    token?: string,
  ) {
    if (await this.subject.isAdmin(subjectId)) {
      return true;
    }
    if (!token) {
      return false;
    }
    try {
      await this.subject.isAuthorizedService.execute({
        permission: {
          route: `/api/ecommerce/${kind}/${id}`,
          method: "PATCH",
          type: "HTTP",
        },
        authorization: { value: token },
      });
      return true;
    } catch (error) {
      if (getHttpErrorType(error).status === 403) {
        return false;
      }
      throw error;
    }
  }

  async detail(
    subjectId: string,
    storeId: string,
    kind: TStoreCatalogDirectoryKind,
    id: string,
    token?: string,
  ): Promise<IStoreCatalogDirectoryDetail> {
    const access = await this.access(subjectId, storeId);
    const {
      items: [item],
    } = await this.subject.repository.storeCatalogDirectory({
      storeId,
      kind,
      ids: [id],
      canReadCosts: access.canReadCosts,
      limit: 1,
      offset: 0,
    });
    if (!item) {
      throw new Error("Not Found error. Directory record is unavailable");
    }
    const ecommerce = this.subject.modules.ecommerce;
    const readers = {
      categories: ecommerce.category,
      "attribute-keys": ecommerce.attributeKey,
      attributes: ecommerce.attribute,
    };
    const record = await readers[kind].findById({ id });
    if (!record) {
      throw new Error("Not Found error. Directory record is unavailable");
    }
    let canEdit = false;
    if (kind === "attributes") {
      canEdit =
        (await this.canCreate(subjectId, storeId, access.canManageCatalog)) &&
        (await this.localAttribute(subjectId, storeId, id));
    } else {
      canEdit = await this.canEditShared(subjectId, kind, id, token);
    }
    let canChangeField = false;
    if (canEdit && kind === "attribute-keys") {
      const links = await ecommerce.attributeKeysToAttributes.find({
        params: { ...criteria({ attributeKeyId: id }).params, limit: 1 },
      });
      canChangeField = links.length === 0;
    }
    return {
      ...item,
      updatedAt: record.updatedAt.toISOString(),
      canEdit,
      canChangeField,
    };
  }

  async update(
    subjectId: string,
    storeId: string,
    id: string,
    data: IStoreCatalogDirectoryUpdate,
    token?: string,
  ) {
    const input = storeCatalogDirectoryUpdateSchema.parse(data);
    return this.subject.repository.withCatalogLock(
      ["ecommerce-catalog"],
      async () => {
        const current = await this.detail(
          subjectId,
          storeId,
          input.kind,
          id,
          token,
        );
        if (!current.canEdit) {
          throw new Error(
            "Permission error. Editing this directory record is not allowed",
          );
        }
        const version =
          await this.subject.repository.lockCatalogDirectoryVersion(
            input.kind,
            id,
          );
        if (
          version !== input.expectedUpdatedAt ||
          version !== current.updatedAt
        ) {
          throw new Error("Conflict error. The record has changed");
        }
        const ecommerce = this.subject.modules.ecommerce;
        if (input.kind === "attributes") {
          let values;
          if (current.field === "number") {
            if (!/^-?\d{1,100}(\.\d{1,8})?$/.test(input.value)) {
              throw new Error(
                "Validation error. Enter a valid numeric attribute value",
              );
            }
            values = { number: input.value };
          } else {
            const previous =
              typeof current.value === "object" ? current.value : {};
            values = { string: { ...previous, [input.language]: input.value } };
          }
          await ecommerce.attribute.update({
            id,
            data: { ...values, adminTitle: input.value.slice(0, 180) },
          });
        } else {
          const changesSlug = Boolean(
            input.slug && input.slug !== current.slug,
          );
          if (
            changesSlug &&
            input.kind === "attribute-keys" &&
            !current.canChangeField
          ) {
            throw new Error(
              "Conflict error. An attribute key in use must keep its slug",
            );
          }
          if (input.slug && changesSlug) {
            const reader =
              input.kind === "categories"
                ? ecommerce.category
                : ecommerce.attributeKey;
            const existing = await reader.find(criteria({ slug: input.slug }));
            if (existing.length) {
              throw new Error("Conflict error. The slug is already in use");
            }
          }
          const data = {
            ...(changesSlug && { slug: input.slug }),
            title: { ...current.title, [input.language]: input.title },
            ...(current.adminTitle === current.title?.[input.language] && {
              adminTitle: input.title,
            }),
          };
          if (input.kind === "categories") {
            await ecommerce.category.update({ id, data });
          } else {
            if (!current.canChangeField && current.field !== input.field) {
              throw new Error(
                "Conflict error. An attribute key in use must keep its field type",
              );
            }
            await ecommerce.attributeKey.update({
              id,
              data: { ...data, field: input.field },
            });
          }
        }
        return this.detail(subjectId, storeId, input.kind, id, token);
      },
    );
  }

  async findAttributes(storeId: string, ids: string[], canReadCosts: boolean) {
    const { items } = await this.subject.repository.storeCatalogDirectory({
      kind: "attributes",
      ids,
      storeId,
      canReadCosts,
      limit: ids.length,
      offset: 0,
    });
    return items;
  }

  private async createNamed(
    language: string,
    input: { title: string; slug?: string; field?: "string" | "number" },
  ): Promise<IStoreCatalogDirectoryItem> {
    const ecommerce = this.subject.modules.ecommerce;
    const data = {
      slug: input.slug,
      title: { [language]: input.title },
      adminTitle: input.title,
    };
    const reader = input.field ? ecommerce.attributeKey : ecommerce.category;
    if (
      input.slug &&
      (await reader.find(criteria({ slug: input.slug }))).length
    ) {
      throw new Error("Conflict error. This slug is already in use");
    }
    if (input.field) {
      const { id, slug, title, adminTitle, field } =
        await ecommerce.attributeKey.create({
          data: { ...data, field: input.field, type: "feature" },
        });
      return { id, slug, title, adminTitle, field };
    }
    const { id, slug, title, adminTitle } = await ecommerce.category.create({
      data,
    });
    return { id, slug, title, adminTitle };
  }

  async create(
    subjectId: string,
    storeId: string,
    data: IStoreCatalogDirectoryCreate,
  ): Promise<IStoreCatalogDirectoryItem> {
    const input = storeCatalogDirectoryCreateSchema.parse(data);
    return this.subject.repository.withCatalogLock(
      ["ecommerce-catalog"],
      async () => {
        const access = await this.access(subjectId, storeId);
        if (
          !(await this.canCreate(subjectId, storeId, access.canManageCatalog))
        ) {
          throw new Error(
            "Permission error. Store catalog management is required",
          );
        }
        if (input.kind !== "attributes") {
          return this.createNamed(input.language, input);
        }
        let key: IStoreCatalogDirectoryItem | undefined;
        if (input.newKey) {
          key = await this.createNamed(input.language, input.newKey);
        } else if (input.keyId) {
          const { items } = await this.subject.repository.storeCatalogDirectory(
            {
              storeId,
              kind: "attribute-keys",
              ids: [input.keyId],
              offset: 0,
              limit: 1,
              canReadCosts: access.canReadCosts,
            },
          );
          [key] = items;
        }
        if (!key || (key.field !== "number" && key.field !== "string")) {
          throw new Error(
            "Validation error. Choose an available attribute key",
          );
        }
        if (
          key.field === "number" &&
          !/^-?\d{1,100}(\.\d{1,8})?$/.test(input.value)
        ) {
          throw new Error(
            "Validation error. Enter a valid numeric attribute value",
          );
        }
        const value =
          key.field === "number"
            ? input.value
            : { [input.language]: input.value };
        const ecommerce = this.subject.modules.ecommerce;
        const attribute = await ecommerce.attribute.create({
          data: {
            adminTitle: input.value.slice(0, 180),
            ...(typeof value === "string"
              ? { number: value }
              : { string: value }),
          },
        });
        await ecommerce.attributeKeysToAttributes.create({
          data: { attributeKeyId: key.id, attributeId: attribute.id },
        });
        await ecommerce.storesToAttributes.create({
          data: { storeId, attributeId: attribute.id },
        });
        return {
          id: attribute.id,
          slug: attribute.slug,
          adminTitle: attribute.adminTitle,
          keyId: key.id,
          keyTitle: key.adminTitle,
          keyTranslations: key.title,
          field: key.field,
          value,
        };
      },
    );
  }
}
