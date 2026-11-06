import type { Service as SubjectsToOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import type { IEcommerceModule } from "../../../../di";
export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  lineIds?: string[];
}
export interface IConstructorProps {
  subjectsToOrders: Pick<SubjectsToOrdersService, "find">;
  ordersToProducts: Pick<IEcommerceModule["ordersToProducts"], "find">;
}
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}
  async execute(props: IExecuteProps): Promise<void> {
    const links = await this.dependencies.subjectsToOrders.find({
      params: {
        filters: {
          and: [
            { column: "subjectId", method: "eq", value: props.subjectId },
            {
              column: "ecommerceModuleOrderId",
              method: "eq",
              value: props.orderId,
            },
          ],
        },
      },
    });
    if (
      !links?.some(
        (link) =>
          link.subjectId === props.subjectId &&
          link.ecommerceModuleOrderId === props.orderId,
      )
    )
      throw new Error(
        "Permission error. Order does not belong to the current subject",
      );
    if (props.lineIds) {
      const lines = await this.dependencies.ordersToProducts.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: props.orderId }],
          },
        },
      });
      const allowed = new Set(
        lines
          ?.filter(
            (line: { orderId: string }) => line.orderId === props.orderId,
          )
          .map((line: { id: string }) => line.id),
      );
      if (props.lineIds.some((id) => !allowed.has(id)))
        throw new Error(
          "Permission error. Order line does not belong to this order",
        );
    }
  }
}
