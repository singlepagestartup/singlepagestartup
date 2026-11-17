import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IOffer } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IEcommerceCartSelection } from "@sps/rbac/models/subject/sdk/model";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
}
export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "ecommerceModuleOrderAssertAccess"
    | "ecommerceModuleCartQuote"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(
    props: IExecuteProps,
  ): Promise<ICartDetails & { storeIds: string[] }> {
    const { service } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess(props);
    const details = await service.ecommerceModule.order.findByIdCartDetails({
      id: props.orderId,
    });
    const storeLinks = await service.ecommerceModule.storesToOrders.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: props.orderId }],
        },
      },
    });
    const primaries = details.lines.filter((line) => !line.parentLineId);
    const offers = new Map<string, IOffer>();
    const selections: IEcommerceCartSelection[] = [];
    const unpriced = [...(details.unpriced ?? [])];
    const quotedLines: ICartDetails["lines"] = [];
    for (const line of primaries) {
      const current = line.offerId
        ? await service.ecommerceModule.storesToProducts.findById({
            id: line.offerId,
          })
        : null;
      const alternatives =
        await service.ecommerceModule.storesToProducts.offersForProduct({
          productId: line.productId,
          ...(current ? { configurationKey: current.configurationKey } : {}),
        });
      for (const offer of alternatives) {
        offers.set(offer.id, offer);
      }
      if (current) {
        offers.set(current.id, current);
      }
      if (
        current &&
        (current.variant !== "default" ||
          (line.product?.kind === "service" && !current.settings.standalone))
      ) {
        unpriced.push({
          ordersToProductsId: line.id,
          productId: line.productId,
          reason:
            "This offer is no longer available. Choose another store or remove the item",
        });
        continue;
      }
      let selected = current;
      if (!selected && alternatives.length === 1) {
        selected = alternatives[0];
      }
      if (!selected) {
        unpriced.push({
          ordersToProductsId: line.id,
          productId: line.productId,
          reason: "Choose a store offer for this cart line",
        });
        continue;
      }
      selections.push({
        offerId: selected.id,
        quantity: line.quantity,
        currencyId: details.billingModuleCurrencyId ?? "",
        destination: line.destination,
        services: details.lines
          .filter((child) => child.parentLineId === line.id && child.offerId)
          .map((child) => ({
            offerId: child.offerId!,
            quantity: child.quantity,
          })),
      });
      quotedLines.push(line);
    }
    const quotes = selections.length
      ? await service.ecommerceModuleCartQuote({
          subjectId: props.subjectId,
          excludeOrderIds: [props.orderId],
          selections,
        })
      : [];
    for (let index = 0; index < quotes.length; index += 1) {
      const quote = quotes[index];
      const line = quotedLines[index];
      if (quote.amount === null || quote.issues.length) {
        unpriced.push({
          ordersToProductsId: line.id,
          productId: line.productId,
          reason:
            quote.issues.map((issue) => issue.message).join("; ") ||
            "Complete this offer selection",
        });
      }
    }
    const storeIds = [
      ...new Set([...offers.values()].map((offer) => offer.storeId)),
    ];
    const stores = storeIds.length
      ? await service.ecommerceModule.store.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: storeIds }],
            },
          },
        })
      : [];
    let availableCurrencyIds = details.availableCurrencyIds;
    if (quotes.length) {
      availableCurrencyIds = quotes[0].currencyIds.filter((currencyId) =>
        quotes.every((quote) => quote.currencyIds.includes(currencyId)),
      );
    }
    return {
      ...details,
      availableCurrencyIds,
      offerQuotes: quotes,
      offers: [...offers.values()].map((offer) => ({
        ...offer,
        store:
          stores.find((store: { id: string }) => store.id === offer.storeId) ??
          null,
      })),
      unpriced: unpriced.filter(
        (issue, index) =>
          unpriced.findIndex(
            (candidate) =>
              candidate.ordersToProductsId === issue.ordersToProductsId &&
              candidate.productId === issue.productId &&
              candidate.reason === issue.reason,
          ) === index,
      ),
      storeIds: storeLinks.map((link: { storeId: string }) => link.storeId),
    };
  }
}
