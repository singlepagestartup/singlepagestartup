import type { IRevocationDependencies } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service/singlepage";
import { Service as PaymentPurchaser } from "../../../startup/ecommerce/order/payment-purchaser";
import type { Service as SubjectService } from "../../index";

export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "subjectsToBillingModulePaymentIntents"
    | "socialModule"
    | "rolesToEcommerceModuleProducts"
    | "ecommerceModule"
  >;
}

export class Service implements IRevocationDependencies {
  constructor(readonly service: IConstructorProps["service"]) {}
  private get paymentPurchaser() {
    return new PaymentPurchaser({
      purchasers: this.service.subjectsToBillingModulePaymentIntents,
      ecommerceModule: this.service.ecommerceModule,
      socialModule: this.service.socialModule,
    });
  }
  async revoke(grant: Parameters<IRevocationDependencies["revoke"]>[0]) {
    const [owners, requirements] = await Promise.all([
      this.paymentPurchaser.orderIdsForSubject(grant.subjectId),
      this.service.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [{ column: "roleId", method: "eq", value: grant.roleId }],
          },
        },
      }),
    ]);
    const products = new Set(
      requirements.map((link) => link.ecommerceModuleProductId),
    );
    for (const orderId of owners) {
      const purchaser = await this.paymentPurchaser.resolveOrder(orderId);
      if (purchaser.subjectId !== grant.subjectId) {
        continue;
      }
      const order = await this.service.ecommerceModule.order.findByIdExtended({
        id: orderId,
      });
      if (
        order?.ordersToProducts?.some((line: { productId: string }) =>
          products.has(line.productId),
        )
      ) {
        await this.service.ecommerceModule.order.revokeSubscription({
          id: orderId,
        });
      }
    }
  }
  async canFulfill(
    grant: Parameters<IRevocationDependencies["canFulfill"]>[0],
    scope: Parameters<IRevocationDependencies["canFulfill"]>[1],
  ) {
    const [owners, requirements] = await Promise.all([
      this.paymentPurchaser.orderIdsForSubject(scope.subjectId),
      this.service.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [{ column: "roleId", method: "eq", value: grant.roleId }],
          },
        },
      }),
    ]);
    if (!owners.includes(scope.orderId)) {
      return false;
    }
    const purchaser = await this.paymentPurchaser.resolveOrder(scope.orderId);
    if (
      purchaser.subjectId !== scope.subjectId ||
      grant.subjectId !== scope.subjectId
    ) {
      return false;
    }
    const order = await this.service.ecommerceModule.order.findByIdExtended({
      id: scope.orderId,
    });
    const products = new Set(
      requirements.map((link) => link.ecommerceModuleProductId),
    );
    if (
      !order ||
      !["delivered", "completed", "canceling", "canceled"].includes(
        order.status,
      ) ||
      !order.ordersToProducts.some((line: { productId: string }) =>
        products.has(line.productId),
      )
    ) {
      return false;
    }
    const now = Date.now();
    for (const orderId of owners) {
      if (orderId !== scope.orderId) {
        const active =
          await this.service.ecommerceModule.order.findByIdExtended({
            id: orderId,
          });
        if (
          active &&
          ["delivering", "requested_cancelation"].includes(active.status) &&
          !active.subscriptionRevokedAt &&
          active.subscriptionPeriodInvoiceId &&
          new Date(active.subscriptionPeriodEndsAt).getTime() > now &&
          active.ordersToProducts.some((line: { productId: string }) =>
            products.has(line.productId),
          )
        ) {
          const activePurchaser =
            await this.paymentPurchaser.resolveOrder(orderId);
          if (activePurchaser.subjectId === scope.subjectId) {
            return false;
          }
        }
      }
    }
    const attributes =
      await this.service.ecommerceModule.order.findByIdCheckoutAttributes({
        id: scope.orderId,
      });
    return (
      attributes?.type === "one_off" ||
      (attributes?.type === "subscription" &&
        ((["canceling", "canceled"].includes(order.status) &&
          !!order.subscriptionRevokedAt) ||
          (!!order.subscriptionPeriodInvoiceId &&
            now >= new Date(order.subscriptionPeriodEndsAt).getTime())))
    );
  }
}
