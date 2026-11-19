import type { Repository } from "../../../../repository";
import type { SubjectServiceDependencies } from "../../index";
import type { IEcommerceCartSelection } from "@sps/rbac/models/subject/sdk/model";

export interface IExecuteProps {
  subjectId: string;
  productId: string;
  storeId?: string;
  offerId?: string;
  quantity: number;
  billingModuleCurrencyId?: string;
  destination?: IEcommerceCartSelection["destination"];
  services?: IEcommerceCartSelection["services"];
  comment?: string;
  expectedQuoteVersion?: string;
}

interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: SubjectServiceDependencies<
    "ecommerceModuleFindOpenCartOrderWithProduct" | "ecommerceModuleCartQuote"
  >;
}

interface ISelectedService {
  offerId: string;
  productId: string;
  quantity: number;
  recurrence: "first" | "each";
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(
    props: IExecuteProps,
  ): Promise<{ orderId: string; lineId: string }> {
    const { repository, service } = this.dependencies;
    const offers =
      await service.modules.ecommerce.storesToProducts.offersForProduct({
        productId: props.productId,
        ...(props.storeId ? { storeId: props.storeId } : {}),
      });
    let offer;
    if (props.offerId) {
      offer = offers.find((candidate) => candidate.id === props.offerId);
    } else if (offers.length === 1) {
      offer = offers[0];
    }
    if (!offer) {
      throw new Error(
        "Validation error. Choose one available store offer for this product",
      );
    }
    const selection: IEcommerceCartSelection = {
      offerId: offer.id,
      quantity: props.quantity,
      currencyId: props.billingModuleCurrencyId ?? "",
      destination: props.destination,
      services: props.services,
    };
    let prepared =
      await service.modules.ecommerce.storesToProducts.quote(selection);
    if (!selection.currencyId) {
      const currencies = await service.modules.billing.currency.find({
        params: {
          filters: {
            and: [{ column: "isDefault", method: "eq", value: true }],
          },
        },
      });
      selection.currencyId =
        currencies.find((currency: { id: string }) =>
          prepared.currencyIds.includes(currency.id),
        )?.id ??
        prepared.currencyIds[0] ??
        "";
      if (!selection.currencyId) {
        throw new Error(
          "Validation error. Offer has no available currency for this selection",
        );
      }
      prepared =
        await service.modules.ecommerce.storesToProducts.quote(selection);
    }
    selection.services = prepared.selectedServices ?? selection.services;
    if (
      props.expectedQuoteVersion &&
      props.expectedQuoteVersion !== prepared.version
    ) {
      throw new Error(
        "Conflict error. Offer terms changed. Review the new price",
      );
    }
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        const existingOrderId =
          await service.ecommerceModuleFindOpenCartOrderWithProduct({
            subjectId: props.subjectId,
            productId: props.productId,
            offerId: offer.id,
          });
        if (existingOrderId) {
          throw new Error("Conflict error. Product is already in the cart");
        }
        await service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.lockOffers(
          {
            offerIds: [
              ...new Set([
                selection.offerId,
                ...(selection.services ?? []).map(
                  (selected) => selected.offerId,
                ),
              ]),
            ],
          },
        );
        const [lockedQuote] =
          await service.modules.ecommerce.storesToProducts.quotesUnderLock(
            [selection],
            [prepared],
            { allowIncompleteDelivery: true },
          );
        const [quote] = await service.ecommerceModuleCartQuote({
          subjectId: props.subjectId,
          selections: [selection],
          preparedQuotes: [lockedQuote],
        });
        const incomplete = new Set(["address_required"]);
        if (
          !quote.currencyIds.includes(selection.currencyId) ||
          quote.issues.some((issue) => !incomplete.has(issue.code))
        ) {
          throw new Error(
            `Validation error. ${quote.issues.find((issue) => !incomplete.has(issue.code))?.message ?? "Offer is not available in the selected currency"}`,
          );
        }
        const selectedServices: ISelectedService[] = [];
        const draftOfferIds = new Set<string>();
        for (const selected of selection.services ?? []) {
          const charge = quote.charges.find(
            (charge) =>
              charge.offerId === selected.offerId && charge.role !== "product",
          );
          if (charge) {
            selectedServices.push({
              ...selected,
              productId: charge.productId,
              recurrence: charge.recurrence,
            });
            continue;
          }
          const option = quote.serviceOptions.find(
            (option) =>
              option.offerId === selected.offerId ||
              option.compatibleOfferIds?.includes(selected.offerId),
          );
          const needsDestination = quote.issues.some(
            (issue) =>
              issue.offerId === selected.offerId &&
              issue.code === "address_required" &&
              option?.receiptMethod === "shipping",
          );
          if (
            !option ||
            option.role !== "delivery" ||
            !option.productId ||
            !option.recurrence ||
            !option.currencyIds.includes(selection.currencyId) ||
            !needsDestination
          ) {
            throw new Error(
              "Validation error. Selected service has no quoted charge",
            );
          }
          selectedServices.push({
            ...selected,
            productId: option.productId,
            recurrence: option.recurrence,
          });
          draftOfferIds.add(selected.offerId);
        }
        if (quote.issues.some((issue) => !draftOfferIds.has(issue.offerId))) {
          throw new Error(
            "Validation error. Complete the selected fulfillment method before adding this product",
          );
        }
        const order = await service.modules.ecommerce.order.create({
          data: { comment: props.comment },
        });
        if (!order) {
          throw new Error("Not Found error. No order found");
        }
        await service.module.subjectsToEcommerceModuleOrders.create({
          data: {
            subjectId: props.subjectId,
            ecommerceModuleOrderId: order.id,
          },
        });
        const primary = await service.modules.ecommerce.ordersToProducts.create(
          {
            data: {
              orderId: order.id,
              productId: props.productId,
              offerId: offer.id,
              quantity: props.quantity,
              destination: quote.destination ?? props.destination ?? {},
              selectionUpdatedAt: new Date(),
              quoteVersion: quote.version,
              quoteExpiresAt: new Date(quote.expiresAt),
            },
          },
        );
        if (!primary) {
          throw new Error("Not Found error. No orders to products found");
        }
        for (const selected of selectedServices) {
          await service.modules.ecommerce.ordersToProducts.create({
            data: {
              orderId: order.id,
              productId: selected.productId,
              offerId: selected.offerId,
              parentLineId: primary.id,
              quantity: selected.quantity,
              recurrence: selected.recurrence,
              selectionUpdatedAt: new Date(),
            },
          });
        }
        const store = await service.modules.ecommerce.storesToOrders.create({
          data: { storeId: offer.storeId, orderId: order.id },
        });
        if (!store) {
          throw new Error("Not Found error. No stores to orders found");
        }
        const currency =
          await service.modules.ecommerce.ordersToBillingModuleCurrencies.create(
            {
              data: {
                orderId: order.id,
                billingModuleCurrencyId: selection.currencyId,
              },
            },
          );
        if (!currency) {
          throw new Error(
            "Not Found error. No orders to billing module currencies found",
          );
        }
        return { orderId: order.id, lineId: primary.id };
      },
    );
  }
}
