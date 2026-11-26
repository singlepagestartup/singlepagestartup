import type { IModel as IAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import type { IModel as IAttributeKey } from "@sps/ecommerce/models/attribute-key/sdk/model";
import type { IModel as IOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IModel as IFile } from "@sps/file-storage/models/file/sdk/model";
import type {
  IStoreProductAttribute,
  IStoreProductAttributeOption,
  IStoreProductRelations,
  TStoreProductRelation,
} from "@sps/rbac/models/subject/sdk/model";
import type { FindServiceProps } from "@sps/shared-backend-api";
import {
  reservedCatalogKeySlugs,
  sensitiveCatalogKeySlugPattern,
} from "@sps/rbac/models/subject/sdk/model/src/lib/store-catalog-directories";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import type { Service as Subject } from "../../../index";
import { criteria } from "../../customer-work/utils";

type TContentChange = Exclude<
  TStoreProductRelation,
  { kind: "remove-price" | "attach-attribute" }
>;
type TAttributeValue = Pick<IAttribute, "string" | "number">;

function inIds(column: string, values: string[]): FindServiceProps {
  return {
    params: {
      filters: {
        and: [{ column, method: "inArray", value: [...new Set(values)] }],
      },
    },
  };
}

function matches<T>(
  reader: { find: (input: FindServiceProps) => Promise<T[]> },
  column: string,
  ids: string[],
) {
  return ids.length ? reader.find(inIds(column, ids)) : Promise.resolve([]);
}

function editableKey(
  key: IAttributeKey,
): key is IAttributeKey & { field: "string" | "number" } {
  return (
    key.variant === "default" &&
    key.type === "feature" &&
    (key.field === "string" || key.field === "number") &&
    !reservedCatalogKeySlugs.includes(key.slug) &&
    !sensitiveCatalogKeySlugPattern.test(key.slug)
  );
}

function showKey(key: IAttributeKey) {
  return (
    ["feature", "interval", "topup"].includes(key.type) &&
    !/(^|[-_])(password|secret|credential|api[-_]key)([-_]|$)/i.test(
      key.slug,
    ) &&
    (key.type === "topup" || !/(^|[-_])token([-_]|$)/i.test(key.slug))
  );
}

function fileSrc(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return path.startsWith("/") && !path.startsWith("//")
    ? `${NEXT_PUBLIC_API_SERVICE_URL}/public${path}`
    : "";
}

function fieldValue(
  attribute: IAttribute,
  field: string,
): IStoreProductAttribute["value"] {
  switch (field) {
    case "string":
      return attribute.string;
    case "number":
      return attribute.number;
    case "boolean":
      return attribute.boolean === null ? null : String(attribute.boolean);
    case "date":
      return attribute.date?.toISOString() ?? null;
    case "datetime":
      return attribute.datetime?.toISOString() ?? null;
    default:
      return null;
  }
}

function featureValue(
  key: IAttributeKey,
  value: string | Record<string, string>,
  previous?: IAttribute,
): Partial<TAttributeValue> {
  if (
    key.field === "number" &&
    typeof value === "string" &&
    /^-?\d{1,100}(\.\d{1,8})?$/.test(value)
  ) {
    return { number: value };
  }
  if (
    key.field === "string" &&
    typeof value === "object" &&
    Object.keys(value).length
  ) {
    return { string: { ...previous?.string, ...value } };
  }
  throw new Error("Validation error. Attribute value does not match its type");
}

export class Relations {
  constructor(private readonly subject: Subject) {}

  private get ecommerce() {
    return this.subject.modules.ecommerce;
  }

  private mediaLinks(productId: string) {
    return this.ecommerce.productsToFileStorageModuleFiles.find({
      params: {
        ...criteria({ productId }).params,
        orderBy: {
          and: [
            { column: "orderIndex", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
  }

  async attachImage(productId: string, fileId: string) {
    const links = await this.mediaLinks(productId);
    const orderIndex =
      links.reduce((last, link) => Math.max(last, link.orderIndex), -1) + 1;
    return this.ecommerce.productsToFileStorageModuleFiles.create({
      data: {
        productId,
        fileStorageModuleFileId: fileId,
        orderIndex,
        variant: "default",
      },
    });
  }

  async attachCategory(productId: string, categoryId: string) {
    const category = await this.ecommerce.category.findById({ id: categoryId });
    if (!category || category.variant !== "default") {
      throw new Error(
        "Not Found error. Category is unavailable for assignment",
      );
    }
    const [current] = await this.ecommerce.categoriesToProducts.find(
      criteria({ productId, categoryId }),
    );
    if (!current) {
      await this.ecommerce.categoriesToProducts.create({
        data: { productId, categoryId },
      });
    }
  }

  private async attributes(productId: string, offerIds: string[]) {
    const ecommerce = this.ecommerce;
    const [products, offers] = await Promise.all([
      ecommerce.productsToAttributes.find(criteria({ productId })),
      matches(
        ecommerce.storesToProductsToAttributes,
        "storesToProductsId",
        offerIds,
      ),
    ]);
    const relations = [
      ...products.map(({ id, attributeId }) => ({
        id,
        attributeId,
        offerId: undefined,
      })),
      ...offers.map(({ id, attributeId, storesToProductsId }) => ({
        id,
        attributeId,
        offerId: storesToProductsId,
      })),
    ];
    const ids = relations.map(({ attributeId }) => attributeId);
    const [attributes, keyLinks, currencyLinks] = await Promise.all([
      matches(ecommerce.attribute, "id", ids),
      matches(ecommerce.attributeKeysToAttributes, "attributeId", ids),
      matches(
        ecommerce.attributesToBillingModuleCurrencies,
        "attributeId",
        ids,
      ),
    ]);
    const keys = await matches(
      ecommerce.attributeKey,
      "id",
      keyLinks.map(({ attributeKeyId }) => attributeKeyId),
    );
    const keysById = new Map(keys.map((key) => [key.id, key]));
    const attributesById = new Map(
      attributes.map((attribute) => [attribute.id, attribute]),
    );
    const withCurrency = new Set(
      currencyLinks.map(({ attributeId }) => attributeId),
    );
    const context = relations.flatMap((relation) => {
      const attribute = attributesById.get(relation.attributeId);
      if (!attribute) {
        return [];
      }
      const links = keyLinks.filter(
        ({ attributeId }) => attributeId === attribute.id,
      );
      const linked = links
        .map(({ attributeKeyId }) => keysById.get(attributeKeyId))
        .filter((key) => key !== undefined);
      return [
        {
          relation,
          attribute,
          linked,
          editable: links.length === 1 && !withCurrency.has(attribute.id),
        },
      ];
    });
    return context;
  }

  async read(
    productId: string,
    offers: IOffer[],
    canEdit: boolean,
    editableOfferIds: ReadonlySet<string> = new Set(),
  ): Promise<IStoreProductRelations> {
    const ecommerce = this.ecommerce;
    const offerIds = offers.map(({ id }) => id);
    const [
      mediaLinks,
      categoryLinks,
      attributeData,
      presentationLinks,
      catalogLinks,
      currencies,
      categoryOptions,
      attributeOptions,
    ] = await Promise.all([
      this.mediaLinks(productId),
      ecommerce.categoriesToProducts.find(criteria({ productId })),
      this.attributes(productId, offerIds),
      ecommerce.productsToWebsiteBuilderModuleWidgets.find(
        criteria({ productId }),
      ),
      ecommerce.widgetsToProducts.find(criteria({ productId })),
      this.subject.modules.billing.currency.find(),
      canEdit ? ecommerce.category.find(criteria({ variant: "default" })) : [],
      editableOfferIds.size
        ? ecommerce.attributeKey.find(
            criteria({ variant: "default", type: "feature" }),
          )
        : [],
    ]);
    const fileIds = mediaLinks.map(
      ({ fileStorageModuleFileId }) => fileStorageModuleFileId,
    );
    const [files, categories, presentation, catalog] = await Promise.all([
      fileIds.length
        ? this.subject.modules.fileStorage.file.publicMetadata(
            inIds("id", fileIds),
          )
        : [],
      matches(
        ecommerce.category,
        "id",
        categoryLinks.map(({ categoryId }) => categoryId),
      ),
      matches(
        this.subject.modules.websiteBuilder.widget,
        "id",
        presentationLinks.map(
          ({ websiteBuilderModuleWidgetId }) => websiteBuilderModuleWidgetId,
        ),
      ),
      matches(
        ecommerce.widget,
        "id",
        catalogLinks.map(({ widgetId }) => widgetId),
      ),
    ]);
    const filesById = new Map<string, IFile>(
      files.map((file: IFile) => [file.id, file] as const),
    );
    const categoriesById = new Map(
      categories.map((category) => [category.id, category]),
    );
    const presentationById = new Map(
      presentation.map((widget) => [widget.id, widget]),
    );
    const catalogById = new Map(catalog.map((widget) => [widget.id, widget]));
    return {
      images: mediaLinks.flatMap(
        ({ id, fileStorageModuleFileId, orderIndex }) => {
          const file = filesById.get(fileStorageModuleFileId);
          if (!file) {
            return [];
          }
          const src = fileSrc(file.file);
          return [
            {
              id,
              fileId: file.id,
              src,
              orderIndex,
              title: file.adminTitle,
              alt: file.alt ?? "",
              mimeType: file.mimeType ?? "",
            },
          ];
        },
      ),
      categories: categoryLinks.flatMap(({ id, categoryId }) => {
        const category = categoriesById.get(categoryId);
        if (!category) {
          return [];
        }
        const { title, adminTitle, slug } = category;
        return [{ id, categoryId, title, adminTitle, slug }];
      }),
      categoryOptions: categoryOptions.map(
        ({ id, title, adminTitle, slug }) => ({ id, title, adminTitle, slug }),
      ),
      attributes: attributeData.flatMap(
        ({ relation, attribute, linked, editable }) => {
          const [key] = linked.filter(showKey);
          if (!key || linked.some((item) => !showKey(item))) {
            return [];
          }
          return [
            {
              ...relation,
              key: key.slug,
              label: key.title?.ru || key.title?.en || key.slug,
              type: key.type,
              field: key.field,
              value: fieldValue(attribute, key.field),
              updatedAt: attribute.updatedAt.toISOString(),
              editable:
                Boolean(
                  relation.offerId && editableOfferIds.has(relation.offerId),
                ) &&
                editable &&
                editableKey(key),
            },
          ];
        },
      ),
      attributeOptions: attributeOptions.flatMap(
        (key: IAttributeKey): IStoreProductAttributeOption[] => {
          if (!editableKey(key)) {
            return [];
          }
          const { id, slug, title, field } = key;
          return [
            { id, key: slug, label: title?.ru || title?.en || slug, field },
          ];
        },
      ),
      widgets: [
        ...presentationLinks.map(
          ({ id, websiteBuilderModuleWidgetId: widgetId }) => ({
            id,
            widgetId,
            title: presentationById.get(widgetId)?.adminTitle ?? widgetId,
            kind: "presentation" as const,
          }),
        ),
        ...catalogLinks.map(({ id, widgetId }) => ({
          id,
          widgetId,
          title: catalogById.get(widgetId)?.adminTitle ?? widgetId,
          kind: "catalog" as const,
        })),
      ],
      currencyOptions: currencies.map(({ id, title, symbol }) => ({
        id,
        title,
        symbol,
      })),
    };
  }

  async update(
    productId: string,
    change: TContentChange,
    updateAttribute: (
      attributeId: string,
      value: Partial<TAttributeValue>,
    ) => Promise<void>,
  ) {
    const ecommerce = this.ecommerce;
    switch (change.kind) {
      case "move-image":
      case "remove-image": {
        const links = await this.mediaLinks(productId);
        const index = links.findIndex(({ id }) => id === change.id);
        if (index === -1) {
          throw new Error(
            "Not Found error. Image is unavailable for this product",
          );
        }
        if (change.kind === "remove-image") {
          await ecommerce.productsToFileStorageModuleFiles.delete({
            id: change.id,
          });
          return;
        }
        let next = index + (change.direction === "up" ? -1 : 1);
        if (change.targetId) {
          next = links.findIndex(({ id }) => id === change.targetId);
          if (next === -1) {
            throw new Error(
              "Not Found error. Target image is unavailable for this product",
            );
          }
        }
        if (next < 0 || next >= links.length) {
          return;
        }
        const [moved] = links.splice(index, 1);
        links.splice(next, 0, moved);
        for (const [orderIndex, link] of links.entries()) {
          if (link.orderIndex !== orderIndex) {
            await ecommerce.productsToFileStorageModuleFiles.update({
              id: link.id,
              data: { orderIndex },
            });
          }
        }
        return;
      }
      case "add-category": {
        await this.attachCategory(productId, change.categoryId);
        return;
      }
      case "remove-category": {
        const [link] = await ecommerce.categoriesToProducts.find(
          criteria({ id: change.id, productId }),
        );
        if (!link) {
          throw new Error(
            "Not Found error. Category is unavailable for this product",
          );
        }
        await ecommerce.categoriesToProducts.delete({ id: link.id });
        return;
      }
      case "add-attribute": {
        const key = await ecommerce.attributeKey.findById({ id: change.keyId });
        if (!key || !editableKey(key)) {
          throw new Error(
            "Permission error. This attribute key cannot be assigned here",
          );
        }
        const current = await this.attributes(productId, [change.offerId]);
        if (
          current.some(
            ({ relation, linked }) =>
              relation.offerId === change.offerId &&
              linked.some(({ id }) => id === key.id),
          )
        ) {
          throw new Error(
            "Conflict error. This offer already has that characteristic",
          );
        }
        const attribute = await ecommerce.attribute.create({
          data: { ...featureValue(key, change.value), adminTitle: key.slug },
        });
        await ecommerce.attributeKeysToAttributes.create({
          data: { attributeId: attribute.id, attributeKeyId: key.id },
        });
        await ecommerce.storesToProductsToAttributes.create({
          data: {
            storesToProductsId: change.offerId,
            attributeId: attribute.id,
          },
        });
        return;
      }
      case "remove-attribute":
      case "update-attribute": {
        const own = await this.attributes(productId, [change.offerId]);
        const current = own.find(
          ({ relation }) =>
            relation.offerId === change.offerId && relation.id === change.id,
        );
        const key = current?.linked[0];
        if (!current || !key || !current.editable || !editableKey(key)) {
          throw new Error(
            "Permission error. This characteristic cannot be edited here",
          );
        }
        if (change.kind === "remove-attribute") {
          await ecommerce.storesToProductsToAttributes.delete({
            id: current.relation.id,
          });
          return;
        }
        if (
          current.attribute.updatedAt.toISOString() !== change.expectedUpdatedAt
        ) {
          throw new Error(
            "Conflict error. This characteristic changed. Reload it before saving",
          );
        }
        await updateAttribute(
          current.attribute.id,
          featureValue(key, change.value, current.attribute),
        );
      }
    }
  }
}
