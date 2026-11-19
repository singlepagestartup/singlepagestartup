import type { IModel as IEcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { IResult as IEcommerceModuleOrdersToProductsResult } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import type { SubjectServiceDependencies } from "../../index";
import { type IQueryBuilderFilter } from "@sps/shared-backend-api";
import { logger } from "@sps/backend-utils";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";

export type IExecuteProps = {
  id: string;
  filters?: IQueryBuilderFilter[];
};

export type IResult = (IEcommerceModuleOrdersToProducts & {
  total: IEcommerceModuleOrdersToProductsResult["ITotalResult"];
})[];

type IConstructorProps = {
  ordersToProducts: Pick<
    SubjectServiceDependencies["modules"]["ecommerce"]["ordersToProducts"],
    "find" | "getTotal"
  >;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
};

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<IResult> {
    const subjectsToEcommerceModuleOrders =
      await this.dependencies.subjectsToEcommerceModuleOrders.find({
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
      await this.dependencies.ordersToProducts.find({
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
        const pricing = await this.dependencies.ordersToProducts.getTotal({
          id: ecommerceModuleOrderToProduct.id,
        });
        total = pricing.totals;
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
