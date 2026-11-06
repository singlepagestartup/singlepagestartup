import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/model";
import { IModel as IEcommerceModuleOrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModulePaymentIntents } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { IModel as IBillingModulePaymentIntentsToCurrecies } from "@sps/billing/relations/payment-intents-to-currencies/sdk/model";
import { IModel as IBillingModulePaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { IModel as IBillingModuleInvoice } from "@sps/billing/models/invoice/sdk/model";
import { Service as BillingCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentsToCurrenciesService } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import { Service as BillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import {
  Service as FindByIdCheckoutAttributesService,
  isSupportedOrderInterval,
  isSupportedOrderType,
  type IResult as IFindByIdCheckoutAttributesResult,
} from "./checkout-attributes";
import { type IExtendedEcommerceModuleProduct } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";

export type IExecuteProps = {
  id: IEcommerceModuleOrder["id"];
};

export type IResult = IEcommerceModuleOrder & {
  checkoutAttributesByCurrency: IFindByIdCheckoutAttributesResult;
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
  findByIdCheckoutAttributes: FindByIdCheckoutAttributesService;
  findByIdExtendedProduct: (props: {
    id: IEcommerceModuleProduct["id"];
  }) => Promise<IExtendedEcommerceModuleProduct>;
  ordersToProducts: OrdersToProductsService;
  ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService;
  ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;
  billingModule: {
    currency: BillingCurrencyService;
    paymentIntent: BillingPaymentIntentService;
    paymentIntentsToCurrencies: BillingPaymentIntentsToCurrenciesService;
    paymentIntentsToInvoices: BillingPaymentIntentsToInvoicesService;
    invoice: BillingInvoiceService;
  };
  fileStorageModule: {
    file: FileStorageFileService;
  };
};

export class Service {
  findById: IConstructorProps["findById"];
  findByIdCheckoutAttributes: FindByIdCheckoutAttributesService;
  findByIdExtendedProduct: IConstructorProps["findByIdExtendedProduct"];
  ordersToProducts: OrdersToProductsService;
  ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService;
  ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;
  billingModule: IConstructorProps["billingModule"];
  fileStorageModule: IConstructorProps["fileStorageModule"];

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.findByIdCheckoutAttributes = props.findByIdCheckoutAttributes;
    this.findByIdExtendedProduct = props.findByIdExtendedProduct;
    this.ordersToProducts = props.ordersToProducts;
    this.ordersToBillingModuleCurrencies =
      props.ordersToBillingModuleCurrencies;
    this.ordersToFileStorageModuleFiles = props.ordersToFileStorageModuleFiles;
    this.ordersToBillingModulePaymentIntents =
      props.ordersToBillingModulePaymentIntents;
    this.billingModule = props.billingModule;
    this.fileStorageModule = props.fileStorageModule;
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

    const productIds = [
      ...new Set(ordersToProducts.map((item) => item.productId)),
    ];
    const extendedProducts = await Promise.all(
      productIds.map((id) => this.findByIdExtendedProduct({ id })),
    );
    const extendedProductsById = new Map(
      extendedProducts.map((item) => [item.id, item]),
    );

    const [billingModuleCurrencies, fileStorageModuleFiles] = await Promise.all(
      [
        this.billingModule.currency.find({
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
        }),
        ordersToFileStorageModuleFiles?.length
          ? this.fileStorageModule.file.find({
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

    const billingModulePaymentIntents =
      ordersToBillingModulePaymentIntents?.length
        ? await this.billingModule.paymentIntent.find({
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
          })
        : [];

    const [paymentIntentsToCurrencies, paymentIntentsToInvoices] =
      await Promise.all([
        billingModulePaymentIntents?.length
          ? this.billingModule.paymentIntentsToCurrencies.find({
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
            })
          : Promise.resolve([]),
        billingModulePaymentIntents?.length
          ? this.billingModule.paymentIntentsToInvoices.find({
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
            })
          : Promise.resolve([]),
      ]);

    const [paymentIntentsCurrencies, paymentIntentsInvoices] =
      await Promise.all([
        paymentIntentsToCurrencies?.length
          ? this.billingModule.currency.find({
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
            })
          : Promise.resolve([]),
        paymentIntentsToInvoices?.length
          ? this.billingModule.invoice.find({
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

    const extendedPaymentIntents: IResult["ordersToBillingModulePaymentIntents"] =
      ordersToBillingModulePaymentIntents.map((item) => {
        const billingModulePaymentIntent = billingModulePaymentIntentsById.get(
          item.billingModulePaymentIntentId,
        );
        if (!billingModulePaymentIntent)
          throw new Error(
            "Not found error. 'billingModulePaymentIntent' not found.",
          );
        return { ...item, billingModulePaymentIntent };
      });
    const checkoutAttributesByCurrency = await this.checkoutPresentation({
      order,
      currency: ordersToBillingModuleCurrencies[0],
      payments: extendedPaymentIntents,
    });

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
      ordersToBillingModulePaymentIntents: extendedPaymentIntents,
    };
  }

  /** Read existing payment terms without making a retired currency purchasable. */
  private async checkoutPresentation(props: {
    order: IEcommerceModuleOrder;
    currency: IEcommerceModuleOrdersToBillingModuleCurrencies;
    payments: IResult["ordersToBillingModulePaymentIntents"];
  }): Promise<IFindByIdCheckoutAttributesResult> {
    const { order, currency, payments } = props;
    const candidates = new Map<
      string,
      { intent: IBillingModulePaymentIntent; invoice: IBillingModuleInvoice }
    >();
    for (const { billingModulePaymentIntent: intent } of payments) {
      const currencyIds = new Set(
        intent.paymentIntentsToCurrencies.map((link) => link.currency.id),
      );
      if (!currencyIds.has(currency.billingModuleCurrencyId)) {
        // Period acceptance considers every paid Invoice on the Order. Do not
        // pair its newest Invoice with another currency's saved interval here.
        if (
          intent.paymentIntentsToInvoices.some(
            ({ invoice }) => invoice.status === "paid",
          )
        )
          throw new Error(
            "Validation error. Paid Invoice currency does not match this Order",
          );
        continue;
      }
      if (currencyIds.size !== 1)
        throw new Error(
          "Validation error. Stored payment currency is ambiguous",
        );
      for (const { invoice } of intent.paymentIntentsToInvoices) {
        const previous = candidates.get(invoice.id);
        if (previous && previous.intent.id !== intent.id)
          throw new Error(
            "Validation error. Stored Invoice has multiple payment contexts",
          );
        candidates.set(invoice.id, { intent, invoice });
      }
    }
    const paid = [...candidates.values()].filter(
      ({ invoice }) => invoice.status === "paid",
    );
    for (const { invoice } of paid)
      if (!Number.isFinite(new Date(invoice.createdAt).getTime()))
        throw new Error("Validation error. Stored Invoice date is invalid");
    if (
      order.subscriptionPeriodInvoiceId &&
      !paid.some(
        ({ invoice }) => invoice.id === order.subscriptionPeriodInvoiceId,
      )
    )
      throw new Error(
        "Validation error. Accepted Invoice is missing from this Order payment context",
      );
    paid.sort((a, b) => {
      const first = new Date(a.invoice.createdAt).getTime();
      const second = new Date(b.invoice.createdAt).getTime();
      return first - second || a.invoice.id.localeCompare(b.invoice.id);
    });
    if (!paid.length && candidates.size > 1)
      throw new Error(
        "Validation error. Unpaid Order has multiple Invoice contexts",
      );
    const selected = paid.at(-1) ?? [...candidates.values()][0];
    if (selected) {
      const { intent, invoice } = selected;
      if (!Number.isFinite(invoice.amount) || invoice.amount < 0)
        throw new Error("Validation error. Stored Invoice amount is invalid");
      if (!isSupportedOrderType(intent.type))
        throw new Error("Validation error. Stored payment type is unsupported");
      // Commerce Product type owns delivery. Telegram can settle a subscription
      // with a one_off Intent while retaining the saved subscription interval.
      const configured = await this.findByIdCheckoutAttributes.execute({
        id: order.id,
      });
      if (configured.type === "subscription") {
        if (intent.interval && isSupportedOrderInterval(intent.interval))
          return {
            amount: invoice.amount,
            type: configured.type,
            interval: intent.interval,
          };
        // Initial Free intentionally has a zero one_off settlement with no
        // provider renewal contract. Keep its Product's delivery interval.
        if (
          invoice.amount !== 0 ||
          intent.type !== "one_off" ||
          intent.interval
        )
          throw new Error(
            "Validation error. Stored subscription interval is unsupported",
          );
      }
      return { ...configured, amount: invoice.amount };
    }
    if (
      payments.some(
        ({ billingModulePaymentIntent }) =>
          billingModulePaymentIntent.paymentIntentsToInvoices.length,
      )
    )
      throw new Error(
        "Validation error. Stored Invoice currency does not match this Order",
      );

    if (order.type === "cart" && order.status === "new") {
      try {
        return await this.findByIdCheckoutAttributes.execute({
          id: order.id,
          billingModuleCurrencyId: currency.billingModuleCurrencyId,
        });
      } catch (error) {
        if (
          !(error instanceof Error) ||
          error.message !==
            "Not Found error. Product does not have any target price attributes"
        )
          throw error;
      }
    }
    // An unbilled legacy cart can still be inspected after its currency retires.
    // This is its saved amount, not a quote accepted by the checkout command.
    const amount = Number(currency.amount);
    if (!currency.amount.trim() || !Number.isFinite(amount) || amount < 0)
      throw new Error("Validation error. Stored Order amount is invalid");
    const configured = await this.findByIdCheckoutAttributes.execute({
      id: order.id,
    });
    return { ...configured, amount };
  }
}
