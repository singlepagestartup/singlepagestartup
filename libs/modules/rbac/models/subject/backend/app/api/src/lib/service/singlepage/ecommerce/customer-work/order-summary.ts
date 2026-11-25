import { addMoney, getHttpErrorType, logger } from "@sps/backend-utils";
import { currencyPrecision } from "@sps/shared-utils";
import type { ICustomerWorkOrderSummary } from "@sps/rbac/models/subject/sdk/model";
import type { Service as SubjectService } from "../../index";
import { criteria } from "./utils";

interface IFindProps {
  subjectId: string;
  orderId: string;
  productId?: string | null;
  offerId?: string;
}

export class Service {
  constructor(readonly subject: SubjectService) {}

  async find(
    props: IFindProps,
  ): Promise<ICustomerWorkOrderSummary | undefined> {
    const { subjectId, orderId, productId, offerId } = props;
    try {
      await this.subject.ecommerceModuleOrderAssertAccess({
        subjectId,
        orderId,
      });
    } catch (error) {
      const { status } = getHttpErrorType(error);
      if (status === 403 || status === 404) {
        return undefined;
      }
      throw error;
    }

    const ecommerce = this.subject.modules.ecommerce;
    const [order, lines] = await Promise.all([
      ecommerce.order.findById({ id: orderId }),
      ecommerce.ordersToProducts.find(criteria({ orderId })),
    ]);
    if (!order) {
      return undefined;
    }

    const candidates = lines.filter(
      (line) =>
        line.orderId === orderId &&
        !line.parentLineId &&
        (!productId || line.productId === productId),
    );
    const exact = offerId
      ? candidates.filter((line) => line.offerId === offerId)
      : candidates;
    const only = candidates.length === 1 ? candidates[0] : undefined;
    const legacy = only && (!offerId || !only.offerId) ? only : undefined;
    const line = exact.length === 1 ? exact[0] : legacy;
    if (!line) {
      return undefined;
    }

    const product = await ecommerce.product.findById({ id: line.productId });
    if (!product || product.variant === "hidden") {
      return undefined;
    }
    const { id, slug, title, shortDescription, type } = product;
    const total = await this.total(orderId, order.type);
    return {
      product: { id, slug, title, shortDescription, type },
      quantity: line.quantity,
      offerId: line.offerId ?? undefined,
      total,
    };
  }

  async total(orderId: string, type: string) {
    const ecommerce = this.subject.modules.ecommerce;
    try {
      if (type === "history") {
        const [payments, resultPrice] = await Promise.all([
          ecommerce.ordersToBillingModulePaymentIntents.find(
            criteria({ orderId }),
          ),
          ecommerce.order.work.resultPriceForOrder(orderId),
        ]);
        if (
          !resultPrice &&
          !payments.some((payment) => payment.purchaseSnapshot)
        ) {
          return undefined;
        }
      }
      const [totals, links] = await Promise.all([
        ecommerce.order.findByIdTotal({ id: orderId }),
        ecommerce.ordersToBillingModuleCurrencies.find(criteria({ orderId })),
      ]);
      const selected = [
        ...new Set(links.map((link) => link.billingModuleCurrencyId)),
      ];
      let currencyId =
        "fixedCurrencyId" in totals ? totals.fixedCurrencyId : undefined;
      if (!currencyId && selected.length === 1) {
        currencyId = selected[0];
      }
      if (
        !currencyId &&
        !selected.length &&
        totals.availableCurrencyIds.length === 1
      ) {
        currencyId = totals.availableCurrencyIds[0];
      }
      if (
        !currencyId ||
        !totals.availableCurrencyIds.includes(currencyId) ||
        totals.unpriced.length
      ) {
        return undefined;
      }
      const entries = totals.totals.filter(
        ({ billingModuleCurrency }) => billingModuleCurrency.id === currencyId,
      );
      const currency = entries[0]?.billingModuleCurrency;
      if (!currency) {
        return undefined;
      }
      return {
        amount: entries.reduce(
          (amount, entry) => addMoney(amount, entry.total),
          0,
        ),
        symbol: currency.symbol,
        precision: currencyPrecision(currency),
      };
    } catch (error) {
      const { status } = getHttpErrorType(error);
      if (status >= 500) {
        logger.warn("Could not read the order total", {
          orderId,
          status,
        });
      }
      return undefined;
    }
  }
}
