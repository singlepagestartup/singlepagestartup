import { type IQueryBuilderFilter } from "@sps/shared-backend-api";
import { logger } from "@sps/backend-utils";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import { IModel as IEcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { type IResult as IEcommerceModuleOrdersToProductsResult } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { type IEcommerceModule } from "../../../../di";

export type IExecuteProps = {
  id: string;
  filters?: IQueryBuilderFilter[];
};

export type IResult = (IEcommerceModuleOrdersToProducts & {
  total: IEcommerceModuleOrdersToProductsResult["ITotalResult"];
})[];

type IConstructorProps = {
  ecommerceModule: IEcommerceModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
};

export class Service {
  ecommerceModule: IEcommerceModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(props: IConstructorProps) {
    this.ecommerceModule = props.ecommerceModule;
    this.subjectsToEcommerceModuleOrders =
      props.subjectsToEcommerceModuleOrders;
  }

  /**
   * The lines of the subject's orders, each with its totals per currency. The
   * cart reads them here because the module-level order line reads require the
   * Admin role (issue #349). A caller's filters only narrow the lines: the
   * constraint to the subject's orders is always applied. A line whose price
   * cannot be computed keeps its place with no totals, so one incomplete
   * product does not hide the rest of the cart.
   */
  async execute(props: IExecuteProps): Promise<IResult> {
    const subjectsToEcommerceModuleOrders =
      await this.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      return [];
    }

    const ecommerceModuleOrdersToProducts =
      await this.ecommerceModule.ordersToProducts.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "inArray",
                value: subjectsToEcommerceModuleOrders.map(
                  (subjectToEcommerceModuleOrder) =>
                    subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
                ),
              },
              ...(props.filters ?? []),
            ],
          },
        },
      });

    if (!ecommerceModuleOrdersToProducts?.length) {
      return [];
    }

    const result: IResult = [];

    for (const ecommerceModuleOrderToProduct of ecommerceModuleOrdersToProducts) {
      let total: IEcommerceModuleOrdersToProductsResult["ITotalResult"] = [];

      try {
        total = await this.ecommerceModule.ordersToProducts.getTotal({
          id: ecommerceModuleOrderToProduct.id,
        });
      } catch (error: any) {
        logger.error("Rbac subject order line total not computed", {
          ecommerceModuleOrderToProductId: ecommerceModuleOrderToProduct.id,
          error,
        });
      }

      result.push({
        ...ecommerceModuleOrderToProduct,
        total,
      });
    }

    return result;
  }
}
