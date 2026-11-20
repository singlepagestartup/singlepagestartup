import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";

export function hasSingleUnitLimit(
  details: ICartDetails,
  line: ICartDetails["lines"][number],
  product?: IProduct,
) {
  return Boolean(
    !line.parentLineId &&
    (line.product?.singleUnitPerOrder ||
      (product?.id === line.productId && product?.singleUnitPerOrder) ||
      details.offerQuotes?.some(
        (quote) =>
          quote.productId === line.productId && quote.singleUnitPerOrder,
      )),
  );
}

export function hasInvalidSingleUnitQuantity(
  details?: ICartDetails,
  product?: IProduct,
) {
  return Boolean(
    hasDuplicateSingleUnitLines(details, product) ||
    details?.lines.some(
      (line) =>
        line.quantity !== 1 && hasSingleUnitLimit(details, line, product),
    ),
  );
}

export function hasDuplicateSingleUnitLines(
  details?: ICartDetails,
  product?: IProduct,
) {
  if (!details) return false;
  const products = new Map<string, boolean>();
  for (const line of details.lines) {
    if (line.parentLineId) continue;
    const restricted = hasSingleUnitLimit(details, line, product);
    const previous = products.get(line.productId);
    if (previous !== undefined && (previous || restricted)) return true;
    products.set(line.productId, restricted);
  }
  return false;
}
