import { Service as CartDetailsService } from "../startup/find-by-id/cart-details";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import { Repository } from "../../repository";
import { Service as ClearOldOrdersService } from "../startup/clear-old-orders";
import type { IExecuteProps as IClearOldOrdersExecuteProps } from "./clear-old-orders";
import type {
  Service as FindByIdCheckoutAttributesService,
  IExecuteProps as IFindByIdCheckoutAttributesExecuteProps,
} from "./find-by-id/checkout-attributes";
import type {
  Service as FindByIdTotalService,
  IExecuteProps as IFindByIdTotalExecuteProps,
} from "./find-by-id/total";
import type {
  Service as FindByIdQuantityService,
  IExecuteProps as IFindByIdQuantityExecuteProps,
} from "./find-by-id/quantity";
import { Service as GetExtendedService } from "../startup/find-by-id/extended";
import type {
  IExecuteProps as IGetExtendedExecuteProps,
  IResult as IGetExtendedResult,
} from "./find-by-id/extended";
import { OrderDI } from "../../di";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToFileStorageModuleFilesService } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as ProductsToFileStorageModuleFilesService } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/service";
import { Service as BillingCurrencyService } from "@sps/billing/models/currency/backend/app/api/src/lib/service";
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentsToCurrenciesService } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentsToInvoicesService } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/service";
import { Service as BillingInvoiceService } from "@sps/billing/models/invoice/backend/app/api/src/lib/service";
import { Service as FileStorageFileService } from "@sps/file-storage/models/file/backend/app/api/src/lib/service";
import { Service as SubscriptionPeriodService } from "../startup/subscription-period";
import type {
  IExecuteProps as ISubscriptionPeriodProps,
  IFreezeProps as ISubscriptionPeriodFreezeProps,
} from "./subscription-period";

export type IExtendedEcommerceModuleOrder = IGetExtendedResult;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;
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
  findByIdCheckoutAttributesService: FindByIdCheckoutAttributesService;
  findByIdTotalService: FindByIdTotalService;
  findByIdQuantityService: FindByIdQuantityService;
  product: ProductService;
  ordersToProducts: OrdersToProductsService;
  ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService;
  ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService;
  productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService;
  ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(OrderDI.IFindByIdCheckoutAttributesService)
    findByIdCheckoutAttributesService: FindByIdCheckoutAttributesService,
    @inject(OrderDI.IFindByIdTotalService)
    findByIdTotalService: FindByIdTotalService,
    @inject(OrderDI.IFindByIdQuantityService)
    findByIdQuantityService: FindByIdQuantityService,
    @inject(OrderDI.IProductsService) product: ProductService,
    @inject(OrderDI.IOrdersToProductsService)
    ordersToProducts: OrdersToProductsService,
    @inject(OrderDI.IOrdersToBillingModuleCurrenciesService)
    ordersToBillingModuleCurrencies: OrdersToBillingModuleCurrenciesService,
    @inject(OrderDI.IOrdersToFileStorageModuleFilesService)
    ordersToFileStorageModuleFiles: OrdersToFileStorageModuleFilesService,
    @inject(OrderDI.IProductsToFileStorageModuleFilesService)
    productsToFileStorageModuleFiles: ProductsToFileStorageModuleFilesService,
    @inject(OrderDI.IOrdersToBillingModulePaymentIntentsService)
    ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService,
    @inject(OrderDI.IBillingModuleCurrencyService)
    billingModuleCurrency: BillingCurrencyService,
    @inject(OrderDI.IBillingModulePaymentIntentService)
    billingModulePaymentIntent: BillingPaymentIntentService,
    @inject(OrderDI.IBillingModulePaymentIntentsToCurrenciesService)
    billingModulePaymentIntentsToCurrencies: BillingPaymentIntentsToCurrenciesService,
    @inject(OrderDI.IBillingModulePaymentIntentsToInvoicesService)
    billingModulePaymentIntentsToInvoices: BillingPaymentIntentsToInvoicesService,
    @inject(OrderDI.IBillingModuleInvoiceService)
    billingModuleInvoice: BillingInvoiceService,
    @inject(OrderDI.IFileStorageModuleFileService)
    fileStorageModuleFile: FileStorageFileService,
  ) {
    super(repository);
    this.billingModule = {
      currency: billingModuleCurrency,
      paymentIntent: billingModulePaymentIntent,
      paymentIntentsToCurrencies: billingModulePaymentIntentsToCurrencies,
      paymentIntentsToInvoices: billingModulePaymentIntentsToInvoices,
      invoice: billingModuleInvoice,
    };
    this.fileStorageModule = {
      file: fileStorageModuleFile,
    };
    this.findByIdCheckoutAttributesService = findByIdCheckoutAttributesService;
    this.findByIdTotalService = findByIdTotalService;
    this.findByIdQuantityService = findByIdQuantityService;
    this.product = product;
    this.ordersToProducts = ordersToProducts;
    this.ordersToBillingModuleCurrencies = ordersToBillingModuleCurrencies;
    this.ordersToFileStorageModuleFiles = ordersToFileStorageModuleFiles;
    this.productsToFileStorageModuleFiles = productsToFileStorageModuleFiles;
    this.ordersToBillingModulePaymentIntents =
      ordersToBillingModulePaymentIntents;
  }

  async findByIdCartDetails(props: { id: string }) {
    return new CartDetailsService({
      ordersToProducts: this.ordersToProducts,
      product: this.product,
      total: (input) => this.findByIdTotal(input),
      ordersToCurrencies: this.ordersToBillingModuleCurrencies,
    }).execute(props);
  }

  async acceptSubscriptionPeriod(props: ISubscriptionPeriodProps) {
    return this.subscriptionPeriodService().execute(props);
  }

  async assertSubscriptionPayment(props: { id: string }) {
    return this.subscriptionPeriodService().assertPayment(props);
  }

  /** A shared recurring contract must survive when another Product still needs it. */
  async hasSharedSubscriptionRenewal(props: { id: string }) {
    const order = await this.findByIdExtended(props);
    const intentIds: string[] = [];
    for (const {
      billingModulePaymentIntent: intent,
    } of order.ordersToBillingModulePaymentIntents) {
      if (intent.type !== "subscription" || intent.amount === 0) {
        continue;
      }
      if (
        await this.billingModule.paymentIntent.hasProviderManagedSubscriptionRenewal(
          { id: intent.id },
        )
      ) {
        intentIds.push(intent.id);
      }
    }
    if (!intentIds.length) {
      return false;
    }
    const links = await this.ordersToBillingModulePaymentIntents.find({
      params: {
        filters: {
          and: [
            {
              column: "billingModulePaymentIntentId",
              method: "inArray",
              value: intentIds,
            },
          ],
        },
      },
    });
    return links.some(
      (link) =>
        intentIds.includes(link.billingModulePaymentIntentId) &&
        link.orderId !== props.id,
    );
  }

  async stopSubscriptionRenewal(props: { id: string }) {
    const order = await this.findByIdExtended(props);
    if (await this.hasSharedSubscriptionRenewal(props)) {
      throw new Error(
        "Conflict error. Shared recurring payment requires reconciliation before cancellation",
      );
    }
    for (const {
      billingModulePaymentIntent: intent,
    } of order.ordersToBillingModulePaymentIntents) {
      await this.billingModule.paymentIntent.stopSubscriptionRenewal({
        id: intent.id,
      });
    }
  }

  async revokeSubscription(props: { id: string }) {
    const order = await this.findByIdExtended(props);
    if (
      order.type !== "history" ||
      order.checkoutAttributesByCurrency.type !== "subscription"
    )
      return undefined;
    return this.repository.revokeSubscription(props);
  }

  async lockForLifecycle(props: { id: string }) {
    return this.repository.lockForLifecycle(props);
  }

  async transitionPaymentStatus(props: {
    id: string;
    expectedStatus: string;
    expectedUpdatedAt: string | Date;
    status: "canceling" | "canceled";
  }) {
    const order = await this.findById({ id: props.id });
    if (
      !order ||
      order.status !== props.expectedStatus ||
      new Date(order.updatedAt).getTime() !==
        new Date(props.expectedUpdatedAt).getTime()
    ) {
      return undefined;
    }
    const recoverable =
      order.type === "history" &&
      Boolean(order.paymentFailureCanceledAt) &&
      !order.subscriptionPeriodInvoiceId &&
      !order.subscriptionPeriodStartsAt &&
      !order.subscriptionPeriodEndsAt &&
      !order.subscriptionRevokedAt;
    const allowed =
      (props.status === "canceling" && order.status === "paying") ||
      (props.status === "canceled" &&
        order.status === "canceling" &&
        recoverable);
    if (!allowed) {
      return undefined;
    }
    return this.repository.writePaymentStatus({
      before: order,
      status: props.status,
    });
  }

  async completePaymentStatus(props: {
    id: string;
    expectedStatus: string;
    expectedUpdatedAt: string | Date;
    onPaymentSucceeded: (
      order: (typeof Table)["$inferSelect"],
    ) => Promise<void>;
  }) {
    return this.repository.withLifecycleLock(
      props.id,
      async () => {
        const order = await this.findById({ id: props.id });
        if (
          !order ||
          order.subscriptionRevokedAt ||
          order.status !== props.expectedStatus ||
          new Date(order.updatedAt).getTime() !==
            new Date(props.expectedUpdatedAt).getTime() ||
          (order.status !== "paying" &&
            (!order.paymentFailureCanceledAt ||
              !["canceling", "canceled"].includes(order.status) ||
              order.type !== "history" ||
              order.subscriptionPeriodInvoiceId ||
              order.subscriptionPeriodStartsAt ||
              order.subscriptionPeriodEndsAt ||
              order.subscriptionRevokedAt))
        ) {
          return undefined;
        }
        // The row lock gives one check ownership before project effects run.
        // Hook failure rolls back and leaves the original payment state retryable.
        await props.onPaymentSucceeded(order);
        const afterHook = await this.findById({ id: props.id });
        if (
          !afterHook ||
          afterHook.status !== order.status ||
          afterHook.subscriptionRevokedAt ||
          new Date(afterHook.paymentFailureCanceledAt ?? 0).getTime() !==
            new Date(order.paymentFailureCanceledAt ?? 0).getTime()
        ) {
          return undefined;
        }
        return this.repository.writePaymentStatus({
          before: afterHook,
          status: "paid",
        });
      },
      "no key update",
    );
  }

  async deleteCanceledWithoutPayment(props: {
    id: string;
    createdBefore: Date;
  }) {
    return this.repository.withLifecycleLock(props.id, async () => {
      const order = await this.findById({ id: props.id });
      if (
        !order ||
        order.status !== "canceled" ||
        order.paymentFailureCanceledAt ||
        new Date(order.createdAt) >= props.createdBefore
      ) {
        return undefined;
      }
      const paymentLinks = await this.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: props.id }],
          },
        },
      });
      if (paymentLinks.length) {
        return undefined;
      }
      return this.delete({ id: props.id });
    });
  }

  async expireSubscriptionPeriod(props: {
    id: string;
    expectedInvoiceId: string;
    expectedEndsAt: string;
  }) {
    const order = await this.findById({ id: props.id });
    const now = new Date();
    if (
      !order ||
      !["delivering", "requested_cancelation"].includes(order.status) ||
      order.subscriptionPeriodInvoiceId !== props.expectedInvoiceId ||
      !order.subscriptionPeriodEndsAt ||
      new Date(order.subscriptionPeriodEndsAt).getTime() !==
        new Date(props.expectedEndsAt).getTime() ||
      new Date(order.subscriptionPeriodEndsAt) > now
    )
      return undefined;
    return this.repository.expireSubscriptionPeriod({ before: order, now });
  }

  async freezeSubscriptionPeriod(props: ISubscriptionPeriodFreezeProps) {
    return this.subscriptionPeriodService().freeze(props);
  }

  private subscriptionPeriodService() {
    return new SubscriptionPeriodService({
      findByIdExtended: (props) => this.findByIdExtended(props),
      findById: (props) => this.findById(props),
      writeSubscriptionPeriod: (props) =>
        this.repository.writeSubscriptionPeriod(props),
    });
  }

  async findByIdExtended(
    props: IGetExtendedExecuteProps,
  ): Promise<IGetExtendedResult> {
    return new GetExtendedService({
      findById: ({ id }) => this.findById({ id }),
      findByIdCheckoutAttributes: this.findByIdCheckoutAttributesService,
      findByIdExtendedProduct: ({ id }) =>
        this.product.findByIdExtended({ id }),
      ordersToProducts: this.ordersToProducts,
      ordersToBillingModuleCurrencies: this.ordersToBillingModuleCurrencies,
      ordersToFileStorageModuleFiles: this.ordersToFileStorageModuleFiles,
      ordersToBillingModulePaymentIntents:
        this.ordersToBillingModulePaymentIntents,
      billingModule: this.billingModule,
      fileStorageModule: this.fileStorageModule,
    }).execute(props);
  }

  async clearOldOrders(props: IClearOldOrdersExecuteProps) {
    return new ClearOldOrdersService({
      find: (findProps) => this.find(findProps),
      deleteCanceledWithoutPayment: (input) =>
        this.deleteCanceledWithoutPayment(input),
    }).execute(props);
  }

  async findByIdCheckoutAttributes(
    props: IFindByIdCheckoutAttributesExecuteProps,
  ) {
    return this.findByIdCheckoutAttributesService.execute(props);
  }

  async findByIdCheckoutAttributesByCurrency(
    props: IFindByIdCheckoutAttributesExecuteProps,
  ) {
    return this.findByIdCheckoutAttributesService.execute(props);
  }

  async findByIdTotal(props: IFindByIdTotalExecuteProps) {
    return this.findByIdTotalService.execute(props);
  }

  async findByIdQuantity(props: IFindByIdQuantityExecuteProps) {
    return this.findByIdQuantityService.execute(props);
  }
}
