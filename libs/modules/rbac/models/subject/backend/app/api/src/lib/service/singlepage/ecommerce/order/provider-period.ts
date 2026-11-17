import type { IProviderPeriodReceipt } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/settlement";
import type { Service as SubjectService } from "../../index";
import type { Repository } from "../../../../repository";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import { moneyMinorUnits } from "@sps/backend-utils";

interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "billingModule"
    | "subjectsToEcommerceModuleOrders"
    | "ecommerceModuleOrderRenewal"
    | "ecommerceModuleOrderAssertAccess"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(
    receipt: IProviderPeriodReceipt,
  ): Promise<{ paymentIntentId: string }> {
    const { service, repository } = this.dependencies;
    const contractLinks =
      await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "billingModulePaymentIntentId",
                method: "eq",
                value: receipt.contractPaymentIntentId,
              },
            ],
          },
        },
      });
    const orderIds = [
      ...new Set<string>(
        contractLinks.map((link: { orderId: string }) => link.orderId),
      ),
    ];
    if (orderIds.length !== 1) {
      throw new Error(
        "Conflict error. Provider subscription must belong to one order",
      );
    }
    const rootId = orderIds[0];
    const owners = await service.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
            { column: "ecommerceModuleOrderId", method: "eq", value: rootId },
          ],
        },
      },
    });
    const subjectIds = [
      ...new Set<string>(owners.map((owner) => owner.subjectId)),
    ];
    if (subjectIds.length !== 1) {
      throw new Error(
        "Conflict error. Provider subscription must have one owner",
      );
    }
    const subjectId = subjectIds[0];
    if (receipt.recordedPaymentIntentId) {
      const recordedIntentId = receipt.recordedPaymentIntentId;
      const recordedLinks =
        await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
          params: {
            filters: {
              and: [
                {
                  column: "billingModulePaymentIntentId",
                  method: "eq",
                  value: recordedIntentId,
                },
              ],
            },
          },
        });
      const ids = [
        ...new Set<string>(
          recordedLinks.map((link: { orderId: string }) => link.orderId),
        ),
      ];
      if (ids.length !== 1) {
        throw new Error(
          "Conflict error. Recorded provider period must belong to one order",
        );
      }
      return repository.withSubjectLock({ subjectId }, async () => {
        await service.ecommerceModuleOrderAssertAccess({
          subjectId,
          orderId: ids[0],
        });
        await service.ecommerceModule.order.lockForLifecycle({ id: ids[0] });
        const recordedOrder = (await service.ecommerceModule.order.findById({
          id: ids[0],
        })) as IOrder | null;
        if (!recordedOrder?.subscriptionPeriodInvoiceId) {
          return { paymentIntentId: recordedIntentId };
        }
        const accepted = await service.billingModule.invoice.findById({
          id: recordedOrder.subscriptionPeriodInvoiceId,
        });
        if (
          accepted?.provider === receipt.provider &&
          accepted.providerId === receipt.providerInvoiceId &&
          (recordedOrder.subscriptionProviderInvoiceId !==
            `${receipt.provider}:${receipt.providerInvoiceId}` ||
            new Date(recordedOrder.subscriptionScheduledStartsAt!).getTime() !==
              new Date(receipt.periodStart).getTime() ||
            new Date(recordedOrder.subscriptionScheduledEndsAt!).getTime() !==
              new Date(receipt.periodEnd).getTime())
        ) {
          await service.ecommerceModule.order.configureNextPeriod({
            id: recordedOrder.id,
            startsAt: new Date(receipt.periodStart),
            endsAt: new Date(receipt.periodEnd),
            providerInvoiceId: `${receipt.provider}:${receipt.providerInvoiceId}`,
          });
        }
        return { paymentIntentId: recordedIntentId };
      });
    }
    const providerInvoiceId = `${receipt.provider}:${receipt.providerInvoiceId}`;
    const existing = (await service.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            {
              column: "subscriptionProviderInvoiceId",
              method: "eq",
              value: providerInvoiceId,
            },
          ],
        },
      },
    })) as IOrder[];
    if (existing.length > 1) {
      throw new Error("Conflict error. Provider period is ambiguous");
    }
    let orderId = existing[0]?.id;
    if (!orderId && receipt.initial) {
      orderId = rootId;
    }
    if (!orderId) {
      let source = (await service.ecommerceModule.order.findById({
        id: rootId,
      })) as IOrder | null;
      const visited = new Set<string>();
      while (source && !visited.has(source.id)) {
        visited.add(source.id);
        const end =
          source.subscriptionScheduledEndsAt ?? source.subscriptionPeriodEndsAt;
        if (!source.subscriptionPeriodInvoiceId || !end) {
          throw new Error(
            "Conflict error. Previous provider period is not confirmed yet",
          );
        }
        const next = (await service.ecommerceModule.order.find({
          params: {
            filters: {
              and: [
                {
                  column: "subscriptionSourceOrderId",
                  method: "eq",
                  value: source.id,
                },
                {
                  column: "subscriptionSourceInvoiceId",
                  method: "eq",
                  value: source.subscriptionPeriodInvoiceId,
                },
              ],
            },
          },
        })) as IOrder[];
        if (
          new Date(end).getTime() === new Date(receipt.periodStart).getTime()
        ) {
          const prepared = await service.ecommerceModuleOrderRenewal(
            { subjectId, orderId: source.id },
            { skipProviderReconciliation: true },
          );
          if (!prepared.orderId || prepared.requiresConfirmation) {
            throw new Error(
              "Conflict error. Provider period needs purchase reconciliation",
            );
          }
          orderId = prepared.orderId;
          break;
        }
        if (next.length !== 1 || !next[0].subscriptionPeriodInvoiceId) {
          throw new Error(
            "Conflict error. Provider period arrived out of sequence",
          );
        }
        source = next[0];
      }
    }
    if (!orderId) {
      throw new Error("Conflict error. Provider period has no local order");
    }
    const targetId = orderId;
    return repository.withSubjectLock({ subjectId }, async () => {
      await service.ecommerceModule.order.lockForLifecycle({ id: rootId });
      if (targetId !== rootId) {
        await service.ecommerceModule.order.lockForLifecycle({ id: targetId });
      }
      await service.ecommerceModuleOrderAssertAccess({
        subjectId,
        orderId: targetId,
      });
      const order = (await service.ecommerceModule.order.findById({
        id: targetId,
      })) as IOrder | null;
      if (
        !order ||
        (order.subscriptionProviderInvoiceId &&
          order.subscriptionProviderInvoiceId !== providerInvoiceId)
      ) {
        throw new Error(
          "Conflict error. Order already belongs to another provider period",
        );
      }
      if (
        order.subscriptionRevokedAt ||
        ["canceled", "canceling"].includes(order.status)
      ) {
        throw new Error(
          "Conflict error. Provider period was explicitly canceled; payment requires reconciliation",
        );
      }
      const links =
        await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: targetId }],
            },
          },
        });
      const intentIds = [
        ...new Set<string>(
          links.map(
            (link: { billingModulePaymentIntentId: string }) =>
              link.billingModulePaymentIntentId,
          ),
        ),
      ];
      if (intentIds.length !== 1) {
        throw new Error(
          "Conflict error. Provider period must have one local payment intent",
        );
      }
      const intent = await service.billingModule.paymentIntent.findById({
        id: intentIds[0],
      });
      if (
        !intent ||
        moneyMinorUnits(intent.amount) !== moneyMinorUnits(receipt.amount)
      ) {
        throw new Error(
          "Conflict error. Provider period amount differs from its saved purchase",
        );
      }
      let currencyId = intent.checkoutCurrencyId;
      if (!currencyId) {
        const currencies =
          await service.ecommerceModule.ordersToBillingModuleCurrencies.find({
            params: {
              filters: {
                and: [{ column: "orderId", method: "eq", value: targetId }],
              },
            },
          });
        if (currencies.length !== 1) {
          throw new Error(
            "Conflict error. Provider period currency is ambiguous",
          );
        }
        currencyId = currencies[0].billingModuleCurrencyId;
      }
      const currency = await service.billingModule.currency.findById({
        id: currencyId,
      });
      if (
        !currency ||
        currency.slug.toLowerCase() !== receipt.currency.toLowerCase()
      ) {
        throw new Error(
          "Conflict error. Provider period currency differs from its saved purchase",
        );
      }
      if (
        order.subscriptionProviderInvoiceId &&
        (new Date(order.subscriptionScheduledStartsAt!).getTime() !==
          new Date(receipt.periodStart).getTime() ||
          new Date(order.subscriptionScheduledEndsAt!).getTime() !==
            new Date(receipt.periodEnd).getTime())
      ) {
        throw new Error(
          "Conflict error. Provider period dates changed after correlation",
        );
      }
      if (order.subscriptionProviderInvoiceId === providerInvoiceId) {
        return { paymentIntentId: intent.id };
      }
      await service.ecommerceModule.order.configureNextPeriod({
        id: targetId,
        startsAt: new Date(receipt.periodStart),
        endsAt: new Date(receipt.periodEnd),
        providerInvoiceId,
      });
      return { paymentIntentId: intent.id };
    });
  }
}
