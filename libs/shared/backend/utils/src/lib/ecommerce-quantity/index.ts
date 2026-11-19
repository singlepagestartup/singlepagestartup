import { SINGLE_UNIT_PER_ORDER_MESSAGE } from "@sps/shared-utils";

interface IQuantityPolicy {
  singleUnitPerOrder?: boolean;
}

export function assertSingleUnitPerOrder(
  product: IQuantityPolicy | null | undefined,
  quantity: number,
) {
  if (product?.singleUnitPerOrder && quantity !== 1) {
    throw new Error(`Validation error. ${SINGLE_UNIT_PER_ORDER_MESSAGE}`);
  }
}
