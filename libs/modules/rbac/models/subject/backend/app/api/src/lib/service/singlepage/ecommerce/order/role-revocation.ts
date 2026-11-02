import type { IRevocationDependencies } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service/singlepage";
import type { Service as SubjectService } from "../../index";

export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "subjectsToEcommerceModuleOrders"
    | "rolesToEcommerceModuleProducts"
    | "ecommerceModule"
  >;
}

export class Service implements IRevocationDependencies {
  constructor(readonly service: IConstructorProps["service"]) {}
  async revoke(grant: Parameters<IRevocationDependencies["revoke"]>[0]) {
    const [owners, requirements] = await Promise.all([
      this.service.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: grant.subjectId },
            ],
          },
        },
      }),
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
    for (const owner of owners) {
      const order = await this.service.ecommerceModule.order.findByIdExtended({
        id: owner.ecommerceModuleOrderId,
      });
      if (
        order?.ordersToProducts?.some((line: { productId: string }) =>
          products.has(line.productId),
        )
      )
        await this.service.ecommerceModule.order.revokeSubscription({
          id: owner.ecommerceModuleOrderId,
        });
    }
  }
  async canFulfill(
    grant: Parameters<IRevocationDependencies["canFulfill"]>[0],
    scope: Parameters<IRevocationDependencies["canFulfill"]>[1],
  ) {
    const [owners, requirements] = await Promise.all([
      this.service.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: scope.subjectId },
            ],
          },
        },
      }),
      this.service.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [{ column: "roleId", method: "eq", value: grant.roleId }],
          },
        },
      }),
    ]);
    if (!owners.some((owner) => owner.ecommerceModuleOrderId === scope.orderId))
      return false;
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
    )
      return false;
    const now = Date.now();
    for (const owner of owners)
      if (owner.ecommerceModuleOrderId !== scope.orderId) {
        const active =
          await this.service.ecommerceModule.order.findByIdExtended({
            id: owner.ecommerceModuleOrderId,
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
        )
          return false;
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
