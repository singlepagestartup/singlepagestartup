import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import type {
  IModel as IOffer,
  IOfferQuoteInput,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type {
  ICartWork,
  ISubjectCartDetails,
} from "@sps/rbac/models/subject/sdk/model";
import type { SubjectServiceDependencies } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
}
export interface IConstructorProps {
  service: SubjectServiceDependencies<
    | "ecommerceModuleOrderAssertAccess"
    | "ecommerceModuleCartQuote"
    | "customerWork"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<ISubjectCartDetails> {
    const { service } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess(props);
    const details = await service.modules.ecommerce.order.findByIdCartDetails({
      id: props.orderId,
    });
    const storeLinks = await service.modules.ecommerce.storesToOrders.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: props.orderId }],
        },
      },
    });
    const storeIdsForOrder = storeLinks.map(
      (link: { storeId: string }) => link.storeId,
    );
    const orderWork = await service.modules.ecommerce.order.work?.findByOrder(
      props.orderId,
    );
    const customerWork =
      orderWork?.customerId === props.subjectId ? orderWork : null;
    const discussion = await service.customerWork.discussionForOrder({
      customerId: props.subjectId,
      orderId: props.orderId,
      taskId: customerWork?.taskId,
    });
    let work: ICartWork | undefined;
    if (customerWork?.kind === "individual-service") {
      const workMetered = customerWork.paymentMode === "work-tokens";
      work = {
        paymentTiming: workMetered ? "work-tokens" : "after-acceptance",
        state:
          !workMetered && details.fixedResultPrice
            ? "awaiting-payment"
            : "awaiting-result",
        orderId: props.orderId,
        storeId: customerWork.storeId,
      };
    }
    const conversation = {
      ...(discussion ? { discussion } : {}),
    };
    if (details.fixedResultPrice) {
      return {
        ...details,
        ...(work?.paymentTiming === "work-tokens" && { totals: [] }),
        storeIds: storeIdsForOrder,
        ...(work ? { work } : {}),
        ...conversation,
      };
    }
    const fulfillment =
      await service.modules.ecommerce.order.fulfillmentQuoteOptions({
        id: props.orderId,
      });
    const primaries = details.lines.filter((line) => !line.parentLineId);
    const offers = new Map<string, IOffer>();
    const selections: IOfferQuoteInput[] = [];
    const unpriced = [...(details.unpriced ?? [])];
    const quotedLines: ICartDetails["lines"] = [];
    for (const line of primaries) {
      const current = line.offerId
        ? await service.modules.ecommerce.storesToProducts.findById({
            id: line.offerId,
          })
        : null;
      const listed =
        await service.modules.ecommerce.storesToProducts.offersForProduct({
          productId: line.productId,
          ...(current ? { configurationKey: current.configurationKey } : {}),
        });
      const alternatives = listed.filter(
        (offer) => !offer.settings?.closedForNewOrders,
      );
      for (const offer of alternatives) {
        offers.set(offer.id, offer);
      }
      if (current) {
        offers.set(current.id, current);
        if (!work && current.settings.requiresResultAcceptance === true) {
          const canOpenDiscussion =
            Boolean(discussion) ||
            (primaries.length === 1 &&
              storeIdsForOrder.length === 1 &&
              storeIdsForOrder[0] === current.storeId &&
              (await service.customerWork.canOpenCartDiscussion({
                storeId: current.storeId,
                productId: line.productId,
                offerId: current.id,
              })));
          work = {
            paymentTiming: current.settings.workTokenPricing
              ? "work-tokens"
              : "after-acceptance",
            state: canOpenDiscussion
              ? "requires-discussion"
              : "discussion-unavailable",
            orderId: props.orderId,
            storeId: current.storeId,
          };
        }
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
        lineId: line.id,
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
          ...(fulfillment.fulfilledLineIds.length
            ? { fulfilledLineIds: fulfillment.fulfilledLineIds }
            : {}),
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
      ? await service.modules.ecommerce.store.find({
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
      ...(work?.paymentTiming === "work-tokens" && { totals: [] }),
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
      storeIds: storeIdsForOrder,
      ...(work ? { work } : {}),
      ...conversation,
    };
  }
}
