import { Service as PaymentPurchaser } from "../../../startup/ecommerce/order/payment-purchaser";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  id: string;
  ecommerceModuleOrderId: string;
  socialModuleProfileId: string;
  data: { expectedUpdatedAt: string };
}
export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "socialModule"
    | "subjectsToBillingModulePaymentIntents"
    | "ecommerceModuleOrderAssertAccess"
    | "subjectsToRoles"
    | "rolesToEcommerceModuleProducts"
    | "ecommerceModule"
  >;
}

/** The controller exposes this maintenance operation only to an operator. */
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps) {
    await this.dependencies.service.ecommerceModuleOrderAssertAccess({
      subjectId: props.id,
      socialModuleProfileId: props.socialModuleProfileId,
      orderId: props.ecommerceModuleOrderId,
    });
    const purchaser = await new PaymentPurchaser({
      purchasers:
        this.dependencies.service.subjectsToBillingModulePaymentIntents,
      ecommerceModule: this.dependencies.service.ecommerceModule,
      socialModule: this.dependencies.service.socialModule,
    }).resolveOrder(props.ecommerceModuleOrderId);
    if (purchaser.profileId !== props.socialModuleProfileId) {
      throw new Error(
        "Permission error. Subscription order does not belong to this profile",
      );
    }
    const order =
      await this.dependencies.service.ecommerceModule.order.findByIdExtended({
        id: props.ecommerceModuleOrderId,
      });
    const productIds = order.ordersToProducts.map((line) => line.productId);
    if (!productIds.length) {
      throw new Error("Validation error. Subscription order has no products");
    }
    const [requirements, grants] = await Promise.all([
      this.dependencies.service.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleProductId",
                method: "inArray",
                value: productIds,
              },
            ],
          },
        },
      }),
      this.dependencies.service.subjectsToRoles.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: purchaser.subjectId },
            ],
          },
        },
      }),
    ]);
    if (
      !requirements.length ||
      productIds.some(
        (id) =>
          !requirements.some((link) => link.ecommerceModuleProductId === id),
      ) ||
      requirements.some(
        (link) =>
          !grants.some(
            (grant) =>
              grant.subjectId === purchaser.subjectId &&
              grant.roleId === link.roleId,
          ),
      )
    ) {
      throw new Error(
        "Permission error. Legacy subscription has no current complete product grant",
      );
    }
    return this.dependencies.service.ecommerceModule.order.freezeSubscriptionPeriod(
      {
        id: props.ecommerceModuleOrderId,
        expectedUpdatedAt: props.data.expectedUpdatedAt,
      },
    );
  }
}
