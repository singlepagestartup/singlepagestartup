import type { Service as ProfilesToOrdersService } from "@sps/social/relations/profiles-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import type { IEcommerceModule } from "../../../../di";
export interface IExecuteProps {
  subjectId: string;
  socialModuleProfileId?: string;
  orderId: string;
  lineIds?: string[];
}
export interface IConstructorProps {
  profilesToOrders: Pick<ProfilesToOrdersService, "find">;
  ordersToProducts: Pick<IEcommerceModule["ordersToProducts"], "find">;
}
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}
  async execute(props: IExecuteProps): Promise<void> {
    const profileId = props.socialModuleProfileId;
    if (!profileId) {
      throw new Error("Permission error. Selected profile is required");
    }
    const links = await this.dependencies.profilesToOrders.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: profileId,
            },
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
          link.profileId === profileId &&
          link.ecommerceModuleOrderId === props.orderId,
      )
    ) {
      throw new Error(
        "Permission error. Order does not belong to the selected profile",
      );
    }
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
      if (props.lineIds.some((id) => !allowed.has(id))) {
        throw new Error(
          "Permission error. Order line does not belong to this order",
        );
      }
    }
  }
}
