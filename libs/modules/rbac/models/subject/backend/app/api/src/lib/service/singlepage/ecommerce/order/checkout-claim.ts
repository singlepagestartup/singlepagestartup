import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { Repository } from "../../../../repository";
import type { IEcommerceModule, ISocialModule } from "../../../../di";

interface ILineSnapshot {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  updatedAt?: Date | string;
}
interface ICurrencySnapshot {
  id: string;
  orderId: string;
  billingModuleCurrencyId: string | null;
  updatedAt?: Date | string;
}
export interface IExecuteProps {
  profileId: string;
  orderIds: string[];
  comment?: string;
  expectedLines?: ILineSnapshot[];
  expectedCurrencies?: ICurrencySnapshot[];
}
export interface IConstructorProps {
  repository: Pick<Repository, "withProfileLock">;
  ecommerceModule: Pick<
    IEcommerceModule,
    "order" | "ordersToProducts" | "ordersToBillingModuleCurrencies"
  >;
  socialModule: Pick<ISocialModule, "profilesToEcommerceModuleOrders">;
}

export class Service {
  constructor(readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<void> {
    const { repository, ecommerceModule, socialModule } = this.dependencies;
    await repository.withProfileLock(
      { profileId: props.profileId },
      async () => {
        const orderIds = [...new Set(props.orderIds)].sort();
        for (const id of orderIds) {
          await ecommerceModule.order.lockForLifecycle({ id });
        }
        const owners = await socialModule.profilesToEcommerceModuleOrders.find({
          params: {
            filters: {
              and: [
                {
                  column: "ecommerceModuleOrderId",
                  method: "inArray",
                  value: orderIds,
                },
              ],
            },
          },
        });
        const lockedOrders: IOrder[] = [];
        for (const id of orderIds) {
          const ownership = owners.filter(
            (link) => link.ecommerceModuleOrderId === id,
          );
          if (
            ownership.length !== 1 ||
            ownership[0].profileId !== props.profileId
          ) {
            throw new Error(
              "Permission error. Checkout order no longer belongs to the selected profile",
            );
          }
          const order = await ecommerceModule.order.findById({ id });
          if (!order || order.type !== "cart" || order.status !== "new") {
            throw new Error(
              "Conflict error. Checkout order is no longer an open cart",
            );
          }
          lockedOrders.push(order);
        }
        const filters = {
          and: [{ column: "orderId", method: "inArray", value: orderIds }],
        };
        if (props.expectedLines) {
          const lines = await ecommerceModule.ordersToProducts.find({
            params: { filters },
          });
          const snapshot = (rows: ILineSnapshot[]) =>
            rows
              .map((row) =>
                [
                  row.id,
                  row.orderId,
                  row.productId,
                  row.quantity,
                  String(row.updatedAt ?? ""),
                ].join("|"),
              )
              .sort()
              .join("\n");
          if (snapshot(lines) !== snapshot(props.expectedLines)) {
            throw new Error(
              "Conflict error. Cart quantities changed during checkout",
            );
          }
        }
        if (props.expectedCurrencies) {
          const currencies =
            await ecommerceModule.ordersToBillingModuleCurrencies.find({
              params: { filters },
            });
          const snapshot = (rows: ICurrencySnapshot[]) =>
            rows
              .map((row) =>
                [
                  row.id,
                  row.orderId,
                  row.billingModuleCurrencyId,
                  String(row.updatedAt ?? ""),
                ].join("|"),
              )
              .sort()
              .join("\n");
          if (snapshot(currencies) !== snapshot(props.expectedCurrencies)) {
            throw new Error(
              "Conflict error. Cart currency changed during checkout",
            );
          }
        }
        // Every order has been rechecked before the first claim is written.
        for (const order of lockedOrders) {
          await ecommerceModule.order.update({
            id: order.id,
            data: {
              ...order,
              type: "history",
              status: "paying",
              ...(props.comment !== undefined
                ? { comment: props.comment }
                : {}),
            },
          });
        }
      },
    );
  }
}
