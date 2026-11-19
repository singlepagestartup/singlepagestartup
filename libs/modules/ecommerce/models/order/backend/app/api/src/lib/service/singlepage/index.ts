import { createModule } from "../module";
import { createModules } from "@sps/ecommerce/backend/app/api/src/lib/modules";
import { Service as FulfillmentQuoteOptionsService } from "../startup/fulfillment-quote-options";
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
import { Service as OrdersToBillingModulePaymentIntentsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";
import { Service as BillingPaymentIntentService } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import { Service as SubscriptionPeriodService } from "../startup/subscription-period";
import { Service as LifecycleService } from "../startup/lifecycle";
import type {
  IExecuteProps as ISubscriptionPeriodProps,
  IFreezeProps as ISubscriptionPeriodFreezeProps,
} from "./subscription-period";

export type IExtendedEcommerceModuleOrder = IGetExtendedResult;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  declare repository: Repository;
  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(OrderDI.IFindByIdCheckoutAttributesService)
    readonly findByIdCheckoutAttributesService: FindByIdCheckoutAttributesService,
    @inject(OrderDI.IFindByIdTotalService)
    readonly findByIdTotalService: FindByIdTotalService,
    @inject(OrderDI.IFindByIdQuantityService)
    readonly findByIdQuantityService: FindByIdQuantityService,
    @inject(OrderDI.IOrdersToBillingModulePaymentIntentsService)
    readonly ordersToBillingModulePaymentIntents: OrdersToBillingModulePaymentIntentsService,
    @inject(OrderDI.IPaymentIntentService)
    readonly paymentIntent: BillingPaymentIntentService,
  ) {
    super(repository);
  }

  protected override async insert(data: Record<string, unknown>) {
    return super.insert(this.lifecycleService().writableData(data));
  }

  override async update(props: {
    id: string;
    data: Partial<(typeof Table)["$inferSelect"]>;
  }) {
    const lifecycle = this.lifecycleService();
    let order: typeof Table.$inferSelect | null = null;
    if (
      lifecycle.protectedLifecycleFields.some((field) => field in props.data)
    ) {
      order = await this.findById({ id: props.id });
    }
    const data = lifecycle.writableData(props.data, order);
    return super.update({ id: props.id, data });
  }

  private lifecycleService() {
    return new LifecycleService(this.repository);
  }

  async findByIdCartDetails(props: { id: string }) {
    return new CartDetailsService({
      ordersToProducts: this.module.ordersToProducts,
      product: this.module.product,
      total: (input) => this.findByIdTotal(input),
      ordersToCurrencies: this.module.ordersToBillingModuleCurrencies,
    }).execute(props);
  }

  async acceptSubscriptionPeriod(props: ISubscriptionPeriodProps) {
    return this.subscriptionPeriodService().execute(props);
  }

  createNextPeriodCart(props: {
    sourceOrderId: string;
    sourceInvoiceId: string;
    interval: string;
  }) {
    return this.lifecycleService().createNextPeriodCart(props);
  }

  configureNextPeriod(
    props: Parameters<LifecycleService["configureNextPeriod"]>[0],
  ) {
    return this.lifecycleService().configureNextPeriod(props);
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
        await this.paymentIntent.hasProviderManagedSubscriptionRenewal({
          id: intent.id,
        })
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
      await this.paymentIntent.stopSubscriptionRenewal({
        id: intent.id,
      });
    }
  }

  async revokeSubscription(props: { id: string }) {
    const order = await this.findByIdExtended(props);
    if (
      order.type !== "history" ||
      order.checkoutAttributesByCurrency.type !== "subscription"
    ) {
      return undefined;
    }
    return this.lifecycleService().revokeSubscription(props);
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
    return this.lifecycleService().writePaymentStatus({
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
        return this.lifecycleService().writePaymentStatus({
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
    ) {
      return undefined;
    }
    return this.lifecycleService().expireSubscriptionPeriod({
      before: order,
      now,
    });
  }

  async freezeSubscriptionPeriod(props: ISubscriptionPeriodFreezeProps) {
    return this.subscriptionPeriodService().freeze(props);
  }

  private subscriptionPeriodService() {
    return new SubscriptionPeriodService({
      findByIdExtended: (props) => this.findByIdExtended(props),
      findById: (props) => this.findById(props),
      writeSubscriptionPeriod: (props) =>
        this.lifecycleService().writeSubscriptionPeriod(props),
    });
  }

  async findByIdExtended(
    props: IGetExtendedExecuteProps,
  ): Promise<IGetExtendedResult> {
    return new GetExtendedService({
      findById: ({ id }) => this.findById({ id }),
      findByIdCheckoutAttributes: this.findByIdCheckoutAttributesService,
      findByIdExtendedProduct: ({ id }) =>
        this.module.product.findByIdExtended({ id }),
      ordersToProducts: this.module.ordersToProducts,
      ordersToBillingModuleCurrencies:
        this.module.ordersToBillingModuleCurrencies,
      ordersToFileStorageModuleFiles:
        this.module.ordersToFileStorageModuleFiles,
      ordersToBillingModulePaymentIntents:
        this.ordersToBillingModulePaymentIntents,
      currency: this.modules.billing.currency,
      paymentIntent: this.paymentIntent,
      paymentIntentsToCurrencies:
        this.modules.billing.paymentIntentsToCurrencies,
      paymentIntentsToInvoices: this.modules.billing.paymentIntentsToInvoices,
      invoice: this.modules.billing.invoice,
      file: this.modules.fileStorage.file,
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
    const saved = await this.savedCheckoutContext(props.id);
    if (saved) {
      return saved.checkoutAttributesByCurrency;
    }
    return this.findByIdCheckoutAttributesService.execute(props);
  }

  async findByIdCheckoutAttributesByCurrency(
    props: IFindByIdCheckoutAttributesExecuteProps,
  ) {
    const saved = await this.savedCheckoutContext(props.id);
    if (saved) {
      return saved.checkoutAttributesByCurrency;
    }
    return this.findByIdCheckoutAttributesService.execute(props);
  }

  private async savedCheckoutContext(id: string) {
    const order = await this.findById({ id });
    if (order?.type !== "history") {
      return;
    }
    const payments = await this.ordersToBillingModulePaymentIntents.find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: id }] },
      },
    });
    if (!payments.some((payment) => payment.purchaseSnapshot)) {
      return;
    }
    const extended = await this.findByIdExtended({ id });
    return extended;
  }

  async fulfillmentQuoteOptions(props: { id: string }) {
    return new FulfillmentQuoteOptionsService({
      findById: (input) => this.findById(input),
      ordersToProducts: this.module.ordersToProducts,
      payments: this.ordersToBillingModulePaymentIntents,
      paymentIntent: this.paymentIntent,
      paymentIntentsToInvoices: this.modules.billing.paymentIntentsToInvoices,
      invoice: this.modules.billing.invoice,
    }).execute(props);
  }

  async findByIdTotal(props: IFindByIdTotalExecuteProps) {
    const saved = await this.savedCheckoutContext(props.id);
    if (saved) {
      const currency =
        saved.ordersToBillingModuleCurrencies[0]?.billingModuleCurrency;
      if (!currency) {
        throw new Error(
          "Validation error. Saved purchase currency is unavailable",
        );
      }
      return {
        totals: [
          {
            total: saved.checkoutAttributesByCurrency.amount,
            billingModuleCurrency: currency,
          },
        ],
        availableCurrencyIds: [currency.id],
        unpriced: [],
      };
    }
    const options = await this.fulfillmentQuoteOptions(props);
    return this.findByIdTotalService.execute(props, options);
  }

  async findByIdQuantity(props: IFindByIdQuantityExecuteProps) {
    return this.findByIdQuantityService.execute(props);
  }
}
