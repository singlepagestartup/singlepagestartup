import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IEcommerceModuleProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { IModel as IEcommerceModuleAttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttributeKey } from "@sps/ecommerce/models/attribute-key/sdk/model";
import { IModel as IEcommerceModuleAttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { IModel as IEcommerceModuleProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/model";
import { IModel as IEcommerceModuleOrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModulePaymentIntents } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { IModel as IBillingModulePaymentIntentsToCurrecies } from "@sps/billing/relations/payment-intents-to-currencies/sdk/model";
import { IModel as IBillingModulePaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { IModel as IBillingModuleInvoice } from "@sps/billing/models/invoice/sdk/model";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as billingModulePaymentIntentsToCurreciesApi } from "@sps/billing/relations/payment-intents-to-currencies/sdk/server";
import { api as billingModulePaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as billingModuleInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import {
  Service as CheckoutAttributesService,
  type IResult as ICheckoutAttributesResult,
} from "./checkout-attributes";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";

export type IExecuteProps = {
  id: IEcommerceModuleOrder["id"];
};

type IExtendedEcommerceModuleAttribute = IEcommerceModuleAttribute & {
  attributeKeysToAttribute?: (IEcommerceModuleAttributeKeysToAttributes & {
    attributeKey?: IEcommerceModuleAttributeKey;
  })[];
  attributesToBillingModuleCurrencies?: (IEcommerceModuleAttributesToBillingModuleCurrencies & {
    billingModuleCurrency?: IBillingModuleCurrency;
  })[];
};

type IExtendedEcommerceModuleProduct = IEcommerceModuleProduct & {
  productsToAttributes?: (IEcommerceModuleProductsToAttributes & {
    attribute: IExtendedEcommerceModuleAttribute;
  })[];
  productsToFileStorageModuleFiles?: (IEcommerceModuleProductsToFileStorageModuleFiles & {
    fileStorageModuleFile?: IFileStorageModuleFile;
  })[];
};

export type IResult = IEcommerceModuleOrder & {
  checkoutAttributesByCurrency: ICheckoutAttributesResult;
  ordersToProducts: (IEcommerceModuleOrdersToProducts & {
    product: IExtendedEcommerceModuleProduct;
  })[];
  ordersToBillingModuleCurrencies: (IEcommerceModuleOrdersToBillingModuleCurrencies & {
    billingModuleCurrency?: IBillingModuleCurrency;
  })[];
  ordersToFileStorageModuleFiles: (IEcommerceModuleOrdersToFileStorageModuleFiles & {
    fileStorageModuleFile?: IFileStorageModuleFile;
  })[];
  ordersToBillingModulePaymentIntents: (IEcommerceModuleOrdersToBillingModulePaymentIntents & {
    billingModulePaymentIntent: IBillingModulePaymentIntent & {
      paymentIntentsToCurrencies: (IBillingModulePaymentIntentsToCurrecies & {
        currency: IBillingModuleCurrency;
      })[];
      paymentIntentsToInvoices: (IBillingModulePaymentIntentsToInvoices & {
        invoice: IBillingModuleInvoice;
      })[];
    };
  })[];
};

type IConstructorProps = {
  findById: (props: {
    id: IEcommerceModuleOrder["id"];
  }) => Promise<IEcommerceModuleOrder | null>;
  checkoutAttributes: CheckoutAttributesService;
  product: ProductService;
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  ordersToProducts: OrdersToProductsService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService;
  ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;
};

export class Service {
  findById: IConstructorProps["findById"];
  checkoutAttributes: CheckoutAttributesService;
  product: ProductService;
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  ordersToProducts: OrdersToProductsService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
  ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService;
  ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.checkoutAttributes = props.checkoutAttributes;
    this.product = props.product;
    this.attribute = props.attribute;
    this.attributeKey = props.attributeKey;
    this.ordersToProducts = props.ordersToProducts;
    this.productsToAttributes = props.productsToAttributes;
    this.attributeKeysToAttributes = props.attributeKeysToAttributes;
    this.attributesToBillingModuleCurrencies =
      props.attributesToBillingModuleCurrencies;
    this.ordersToBillingModuleCurrencies =
      props.ordersToBillingModuleCurrencies;
    this.ordersToFileStorageModuleFiles = props.ordersToFileStorageModuleFiles;
    this.productsToFileStorageModuleFiles =
      props.productsToFileStorageModuleFiles;
    this.ordersToBillingModulePaymentIntents =
      props.ordersToBillingModulePaymentIntents;
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
    const ecommerceModuleAttribute = await this.attribute.findById({
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
        ? this.attributeKey.find({
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

  private async extendedEcommerceModuleProduct(
    props: IEcommerceModuleProduct,
  ): Promise<IExtendedEcommerceModuleProduct> {
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

    const filesById = new Map(
      (fileStorageModuleFiles ?? []).map((item) => [item.id, item]),
    );

    return {
      ...props,
      productsToAttributes: productsToAttributesWithAttributes,
      productsToFileStorageModuleFiles:
        productsToFileStorageModuleFiles?.map((item) => {
          return {
            ...item,
            fileStorageModuleFile: filesById.get(item.fileStorageModuleFileId),
          };
        }) ?? [],
    };
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    const order = await this.findById({
      id: props.id,
    });

    if (!order) {
      throw new Error("Not found error. 'order' not found.");
    }

    const [
      ordersToProducts,
      ordersToBillingModuleCurrencies,
      ordersToFileStorageModuleFiles,
      ordersToBillingModulePaymentIntents,
    ] = await Promise.all([
      this.ordersToProducts.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      }),
      this.ordersToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      }),
      this.ordersToFileStorageModuleFiles.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      }),
      this.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      }),
    ]);

    if (!ordersToProducts?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleOrdersToProducts' not found.",
      );
    }

    if (!ordersToBillingModuleCurrencies?.length) {
      throw new Error(
        "Not found error. 'ordersToBillingModuleCurrencies' not found.",
      );
    }

    const products = await this.product.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ordersToProducts.map((item) => item.productId),
            },
          ],
        },
      },
    });

    if (!products?.length) {
      throw new Error("Not found error. 'products' not found.");
    }

    const extendedProducts = await Promise.all(
      products.map((product) => this.extendedEcommerceModuleProduct(product)),
    );
    const extendedProductsById = new Map(
      extendedProducts.map((item) => [item.id, item]),
    );

    const [billingModuleCurrencies, fileStorageModuleFiles] = await Promise.all(
      [
        billingModuleCurrencyApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: ordersToBillingModuleCurrencies.map(
                    (item) => item.billingModuleCurrencyId,
                  ),
                },
              ],
            },
          },
          options: {
            headers: this.getSdkHeaders(),
          },
        }),
        ordersToFileStorageModuleFiles?.length
          ? fileStorageModuleFileApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: ordersToFileStorageModuleFiles.map(
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
          : Promise.resolve([]),
      ],
    );

    const billingModuleCurrenciesById = new Map(
      (billingModuleCurrencies ?? []).map((item) => [item.id, item]),
    );
    const fileStorageModuleFilesById = new Map(
      (fileStorageModuleFiles ?? []).map((item) => [item.id, item]),
    );

    const checkoutAttributesByCurrency = await this.checkoutAttributes.execute({
      id: props.id,
      billingModuleCurrencyId:
        ordersToBillingModuleCurrencies[0].billingModuleCurrencyId,
    });

    const billingModulePaymentIntents =
      ordersToBillingModulePaymentIntents?.length
        ? await billingModulePaymentIntentApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: ordersToBillingModulePaymentIntents.map(
                      (item) => item.billingModulePaymentIntentId,
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

    const [paymentIntentsToCurrencies, paymentIntentsToInvoices] =
      await Promise.all([
        billingModulePaymentIntents?.length
          ? billingModulePaymentIntentsToCurreciesApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "paymentIntentId",
                      method: "inArray",
                      value: billingModulePaymentIntents.map((item) => item.id),
                    },
                  ],
                },
              },
              options: {
                headers: this.getSdkHeaders(),
              },
            })
          : Promise.resolve([]),
        billingModulePaymentIntents?.length
          ? billingModulePaymentIntentsToInvoicesApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "paymentIntentId",
                      method: "inArray",
                      value: billingModulePaymentIntents.map((item) => item.id),
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

    const [paymentIntentsCurrencies, paymentIntentsInvoices] =
      await Promise.all([
        paymentIntentsToCurrencies?.length
          ? billingModuleCurrencyApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: paymentIntentsToCurrencies.map(
                        (item) => item.currencyId,
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
        paymentIntentsToInvoices?.length
          ? billingModuleInvoiceApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: paymentIntentsToInvoices.map(
                        (item) => item.invoiceId,
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

    const paymentIntentsCurrenciesById = new Map(
      (paymentIntentsCurrencies ?? []).map((item) => [item.id, item]),
    );
    const paymentIntentsInvoicesById = new Map(
      (paymentIntentsInvoices ?? []).map((item) => [item.id, item]),
    );

    const paymentIntentsToCurrenciesByPaymentIntentId = new Map<
      string,
      (IBillingModulePaymentIntentsToCurrecies & {
        currency: IBillingModuleCurrency;
      })[]
    >();

    for (const item of paymentIntentsToCurrencies ?? []) {
      const currency = paymentIntentsCurrenciesById.get(item.currencyId);

      if (!currency) {
        continue;
      }

      const existing =
        paymentIntentsToCurrenciesByPaymentIntentId.get(item.paymentIntentId) ??
        [];

      paymentIntentsToCurrenciesByPaymentIntentId.set(item.paymentIntentId, [
        ...existing,
        {
          ...item,
          currency,
        },
      ]);
    }

    const paymentIntentsToInvoicesByPaymentIntentId = new Map<
      string,
      (IBillingModulePaymentIntentsToInvoices & {
        invoice: IBillingModuleInvoice;
      })[]
    >();

    for (const item of paymentIntentsToInvoices ?? []) {
      const invoice = paymentIntentsInvoicesById.get(item.invoiceId);

      if (!invoice) {
        continue;
      }

      const existing =
        paymentIntentsToInvoicesByPaymentIntentId.get(item.paymentIntentId) ??
        [];

      paymentIntentsToInvoicesByPaymentIntentId.set(item.paymentIntentId, [
        ...existing,
        {
          ...item,
          invoice,
        },
      ]);
    }

    const billingModulePaymentIntentsById = new Map(
      (billingModulePaymentIntents ?? []).map((item) => {
        return [
          item.id,
          {
            ...item,
            paymentIntentsToCurrencies:
              paymentIntentsToCurrenciesByPaymentIntentId.get(item.id) ?? [],
            paymentIntentsToInvoices:
              paymentIntentsToInvoicesByPaymentIntentId.get(item.id) ?? [],
          },
        ];
      }),
    );

    return {
      ...order,
      checkoutAttributesByCurrency,
      ordersToProducts: ordersToProducts.map((orderToProduct) => {
        const product = extendedProductsById.get(orderToProduct.productId);

        if (!product) {
          throw new Error("Not found error. 'product' not found.");
        }

        return {
          ...orderToProduct,
          product,
        };
      }),
      ordersToBillingModuleCurrencies: ordersToBillingModuleCurrencies.map(
        (item) => {
          return {
            ...item,
            billingModuleCurrency: billingModuleCurrenciesById.get(
              item.billingModuleCurrencyId,
            ),
          };
        },
      ),
      ordersToFileStorageModuleFiles:
        ordersToFileStorageModuleFiles?.map((item) => {
          return {
            ...item,
            fileStorageModuleFile: fileStorageModuleFilesById.get(
              item.fileStorageModuleFileId,
            ),
          };
        }) ?? [],
      ordersToBillingModulePaymentIntents:
        ordersToBillingModulePaymentIntents?.map((item) => {
          const billingModulePaymentIntent =
            billingModulePaymentIntentsById.get(
              item.billingModulePaymentIntentId,
            );

          if (!billingModulePaymentIntent) {
            throw new Error(
              "Not found error. 'billingModulePaymentIntent' not found.",
            );
          }

          return {
            ...item,
            billingModulePaymentIntent,
          };
        }) ?? [],
    };
  }
}
