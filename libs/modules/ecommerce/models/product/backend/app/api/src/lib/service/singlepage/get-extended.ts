import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceModuleProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { IModel as IEcommerceModuleAttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttributeKey } from "@sps/ecommerce/models/attribute-key/sdk/model";
import { IModel as IEcommerceModuleAttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { IModel as IEcommerceModuleProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";

export type IExecuteProps = {
  id: IEcommerceModuleProduct["id"];
};

type IExtendedEcommerceModuleAttribute = IEcommerceModuleAttribute & {
  attributeKeysToAttribute?: (IEcommerceModuleAttributeKeysToAttributes & {
    attributeKey?: IEcommerceModuleAttributeKey;
  })[];
  attributesToBillingModuleCurrencies?: (IEcommerceModuleAttributesToBillingModuleCurrencies & {
    billingModuleCurrency?: IBillingModuleCurrency;
  })[];
};

export type IResult = IEcommerceModuleProduct & {
  productsToAttributes?: (IEcommerceModuleProductsToAttributes & {
    attribute: IExtendedEcommerceModuleAttribute;
  })[];
  productsToFileStorageModuleFiles?: (IEcommerceModuleProductsToFileStorageModuleFiles & {
    fileStorageModuleFile?: IFileStorageModuleFile;
  })[];
};

type IFindById = (props: {
  id: IEcommerceModuleProduct["id"];
}) => Promise<IEcommerceModuleProduct | null>;

export interface IConstructorProps {
  findById: IFindById;
  productsToAttributes: ProductsToAttributesService;
  attributes: AttributeService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributeKeys: AttributeKeyService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;
}

export class Service {
  findById: IFindById;
  productsToAttributes: ProductsToAttributesService;
  attributes: AttributeService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributeKeys: AttributeKeyService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.productsToAttributes = props.productsToAttributes;
    this.attributes = props.attributes;
    this.attributeKeysToAttributes = props.attributeKeysToAttributes;
    this.attributeKeys = props.attributeKeys;
    this.attributesToBillingModuleCurrencies =
      props.attributesToBillingModuleCurrencies;
    this.productsToFileStorageModuleFiles =
      props.productsToFileStorageModuleFiles;
  }

  private getSdkHeaders() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    return {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    };
  }

  private async extendedEcommerceModuleAttributeById(props: {
    id: IEcommerceModuleAttribute["id"];
  }): Promise<IExtendedEcommerceModuleAttribute> {
    const ecommerceModuleAttribute = await this.attributes.findById({
      id: props.id,
    });

    if (!ecommerceModuleAttribute) {
      throw new Error("Not found error. 'attribute' not found.");
    }

    const [attributeKeysToAttributes, attributesToBillingModuleCurrencies] =
      await Promise.all([
        this.attributeKeysToAttributes.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
        }),
        this.attributesToBillingModuleCurrencies.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
        }),
      ]);

    const [attributeKeys, billingModuleCurrencies] = await Promise.all([
      attributeKeysToAttributes?.length
        ? this.attributeKeys.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: attributeKeysToAttributes.map(
                      (item) => item.attributeKeyId,
                    ),
                  },
                ],
              },
            },
          })
        : Promise.resolve([]),
      attributesToBillingModuleCurrencies?.length
        ? billingModuleCurrencyApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: attributesToBillingModuleCurrencies.map(
                      (item) => item.billingModuleCurrencyId,
                    ),
                  },
                ],
              },
            },
            options: {
              headers: this.getSdkHeaders(),
            },
          })
        : Promise.resolve([]),
    ]);

    const attributeKeysById = new Map(
      (attributeKeys ?? []).map((item) => [item.id, item]),
    );
    const billingModuleCurrenciesById = new Map(
      (billingModuleCurrencies ?? []).map((item) => [item.id, item]),
    );

    return {
      ...ecommerceModuleAttribute,
      attributeKeysToAttribute:
        attributeKeysToAttributes?.map((item) => {
          return {
            ...item,
            attributeKey: attributeKeysById.get(item.attributeKeyId),
          };
        }) ?? [],
      attributesToBillingModuleCurrencies:
        attributesToBillingModuleCurrencies?.map((item) => {
          return {
            ...item,
            billingModuleCurrency: billingModuleCurrenciesById.get(
              item.billingModuleCurrencyId,
            ),
          };
        }) ?? [],
    };
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    const ecommerceModuleProduct = await this.findById({
      id: props.id,
    });

    if (!ecommerceModuleProduct) {
      throw new Error("Not found error. 'product' not found.");
    }

    const productsToAttributes = await this.productsToAttributes.find({
      params: {
        filters: {
          and: [
            {
              column: "productId",
              method: "eq",
              value: props.id,
            },
          ],
        },
      },
    });

    const productsToAttributesWithAttributes = productsToAttributes?.length
      ? await Promise.all(
          productsToAttributes.map(async (item) => {
            return {
              ...item,
              attribute: await this.extendedEcommerceModuleAttributeById({
                id: item.attributeId,
              }),
            };
          }),
        )
      : [];

    const productsToFileStorageModuleFiles =
      await this.productsToFileStorageModuleFiles.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      });

    const fileStorageModuleFiles = productsToFileStorageModuleFiles?.length
      ? await fileStorageModuleFileApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: productsToFileStorageModuleFiles.map(
                    (item) => item.fileStorageModuleFileId,
                  ),
                },
              ],
            },
          },
          options: {
            headers: this.getSdkHeaders(),
          },
        })
      : [];

    const fileStorageModuleFilesById = new Map(
      (fileStorageModuleFiles ?? []).map((item) => [item.id, item]),
    );

    return {
      ...ecommerceModuleProduct,
      productsToAttributes: productsToAttributesWithAttributes,
      productsToFileStorageModuleFiles:
        productsToFileStorageModuleFiles?.map((item) => {
          return {
            ...item,
            fileStorageModuleFile: fileStorageModuleFilesById.get(
              item.fileStorageModuleFileId,
            ),
          };
        }) ?? [],
    };
  }
}
