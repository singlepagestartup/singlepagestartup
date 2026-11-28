import type { IModel as IOrderLine } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { IPurchaseSnapshot } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type {
  ICustomerOrderDelivery,
  ICustomerOrderMoney,
} from "@sps/rbac/models/subject/sdk/model";
import type { IOrderPayment } from "./checkout";

type TDestination = Pick<
  ICustomerOrderDelivery,
  "address" | "region" | "pickupPointId"
>;
type TLine = Pick<IOrderLine, "id" | "orderId" | "productId" | "quantity"> & {
  destination?: TDestination | null;
};

export function collectOrderLines(
  orderIds: string[],
  lines: TLine[],
  payments: Map<string, IOrderPayment>,
) {
  const byOrder = new Map<string, Map<string, TLine>>();
  for (const orderId of orderIds) {
    byOrder.set(orderId, new Map());
  }
  for (const line of lines) {
    byOrder.get(line.orderId)?.set(line.id, line);
  }
  for (const [orderId, all] of byOrder) {
    const payment = payments.get(orderId);
    for (const saved of payment?.saved?.ordersToProducts ?? []) {
      if (saved.orderId === orderId && !all.has(saved.id)) {
        all.set(saved.id, saved);
      }
    }
    for (const link of payment?.links ?? []) {
      const charge = link.purchaseSnapshot?.charge;
      if (
        link.orderId === orderId &&
        charge &&
        link.orderLineId &&
        !all.has(link.orderLineId)
      ) {
        all.set(link.orderLineId, {
          id: link.orderLineId,
          orderId,
          productId: charge.productId,
          quantity: charge.quantity,
        });
      }
    }
  }
  return byOrder;
}

export function lineDelivery(
  destination: TDestination | null | undefined,
  charge: IPurchaseSnapshot["charge"] | undefined,
  price: ICustomerOrderMoney | undefined,
) {
  const entry: ICustomerOrderDelivery = {};
  if (destination?.address) {
    entry.address = destination.address;
  }
  if (destination?.region) {
    entry.region = destination.region;
  }
  if (
    destination &&
    "pickupPointId" in destination &&
    typeof destination.pickupPointId === "string" &&
    destination.pickupPointId
  ) {
    entry.pickupPointId = destination.pickupPointId;
  }
  if (charge?.role === "delivery") {
    entry.method = charge.title;
    entry.price = price;
  }
  if (Object.keys(entry).length) {
    return entry;
  }

  return undefined;
}

export function distinctDeliveries(delivery: ICustomerOrderDelivery[]) {
  // A quote copies the destination to every charge, including the delivery line.
  return delivery.filter(
    (entry, index) =>
      !delivery.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          entry.address === other.address &&
          entry.region === other.region &&
          entry.pickupPointId === other.pickupPointId &&
          ((!entry.method && !!other.method) ||
            (entry.method === other.method && index > otherIndex)),
      ),
  );
}
