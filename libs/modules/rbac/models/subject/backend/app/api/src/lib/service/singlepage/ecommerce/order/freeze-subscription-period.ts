import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  id: string;
  ecommerceModuleOrderId: string;
  data: { expectedUpdatedAt: string };
}
export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "subjectsToEcommerceModuleOrders"
    | "subjectsToRoles"
    | "rolesToEcommerceModuleProducts"
    | "ecommerceModule"
  >;
}

/** The controller exposes this maintenance operation only to an operator. */
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps) {
    const ownerLinks =
      await this.dependencies.service.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: props.id },
              {
                column: "ecommerceModuleOrderId",
                method: "eq",
                value: props.ecommerceModuleOrderId,
              },
            ],
          },
        },
      });
    if (
      !ownerLinks.some(
        (link) =>
          link.subjectId === props.id &&
          link.ecommerceModuleOrderId === props.ecommerceModuleOrderId,
      )
    )
      throw new Error(
        "Permission error. Subscription order does not belong to this subject",
      );
    const order =
      await this.dependencies.service.ecommerceModule.order.findByIdExtended({
        id: props.ecommerceModuleOrderId,
      });
    const productIds = order.ordersToProducts.map((line) => line.productId);
    if (!productIds.length)
      throw new Error("Validation error. Subscription order has no products");
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
            and: [{ column: "subjectId", method: "eq", value: props.id }],
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
              grant.subjectId === props.id && grant.roleId === link.roleId,
          ),
      )
    )
      throw new Error(
        "Permission error. Legacy subscription has no current complete product grant",
      );
    return this.dependencies.service.ecommerceModule.order.freezeSubscriptionPeriod(
      {
        id: props.ecommerceModuleOrderId,
        expectedUpdatedAt: props.data.expectedUpdatedAt,
      },
    );
  }
}
