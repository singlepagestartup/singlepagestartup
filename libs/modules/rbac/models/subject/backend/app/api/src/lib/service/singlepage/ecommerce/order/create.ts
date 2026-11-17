import type { Repository } from "../../../../repository";
import type { Service as SubjectService } from "../../index";
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
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "billingModule"
    | "subjectsToEcommerceModuleOrders"
    | "ecommerceModuleFindOpenCartOrderWithProduct"
    | "ecommerceModuleCartQuote"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(
    props: IExecuteProps,
  ): Promise<{ orderId: string; lineId: string }> {
    const { repository, service } = this.dependencies;
    const offers =
      await service.ecommerceModule.storesToProducts.offersForProduct({
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
      await service.ecommerceModule.storesToProducts.quote(selection);
    if (!selection.currencyId) {
      const currencies = await service.billingModule.currency.find({
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
        await service.ecommerceModule.storesToProducts.quote(selection);
    }
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
        await service.ecommerceModule.ordersToBillingModulePaymentIntents.lockOffers(
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
          await service.ecommerceModule.storesToProducts.quotesUnderLock(
            [selection],
            [prepared],
            { allowIncompleteDelivery: true },
          );
        const [quote] = await service.ecommerceModuleCartQuote({
          subjectId: props.subjectId,
          selections: [selection],
          preparedQuotes: [lockedQuote],
        });
        const incomplete = new Set([
          "delivery_required",
          "address_required",
          "pickup_required",
        ]);
        if (
          !quote.currencyIds.includes(selection.currencyId) ||
          quote.issues.some((issue) => !incomplete.has(issue.code))
        ) {
          throw new Error(
            `Validation error. ${quote.issues.find((issue) => !incomplete.has(issue.code))?.message ?? "Offer is not available in the selected currency"}`,
          );
        }
        const order = await service.ecommerceModule.order.create({
          data: { comment: props.comment },
        });
        if (!order) {
          throw new Error("Not Found error. No order found");
        }
        await service.subjectsToEcommerceModuleOrders.create({
          data: {
            subjectId: props.subjectId,
            ecommerceModuleOrderId: order.id,
          },
        });
        const primary = await service.ecommerceModule.ordersToProducts.create({
          data: {
            orderId: order.id,
            productId: props.productId,
            offerId: offer.id,
            quantity: props.quantity,
            destination: props.destination ?? {},
            selectionUpdatedAt: new Date(),
            quoteVersion: quote.version,
            quoteExpiresAt: new Date(quote.expiresAt),
          },
        });
        if (!primary) {
          throw new Error("Not Found error. No orders to products found");
        }
        for (const selected of selection.services ?? []) {
          const serviceOffer =
            await service.ecommerceModule.storesToProducts.findById({
              id: selected.offerId,
            });
          if (
            !serviceOffer ||
            !quote.serviceOptions.some(
              (option) => option.offerId === selected.offerId,
            )
          ) {
            throw new Error(
              "Validation error. Selected service does not belong to this offer",
            );
          }
          const charge = quote.charges.find(
            (charge) =>
              charge.offerId === selected.offerId && charge.role !== "product",
          );
          await service.ecommerceModule.ordersToProducts.create({
            data: {
              orderId: order.id,
              productId: serviceOffer.productId,
              offerId: serviceOffer.id,
              parentLineId: primary.id,
              quantity: selected.quantity,
              recurrence: charge?.recurrence ?? "each",
              selectionUpdatedAt: new Date(),
            },
          });
        }
        const store = await service.ecommerceModule.storesToOrders.create({
          data: { storeId: offer.storeId, orderId: order.id },
        });
        if (!store) {
          throw new Error("Not Found error. No stores to orders found");
        }
        const currency =
          await service.ecommerceModule.ordersToBillingModuleCurrencies.create({
            data: {
              orderId: order.id,
              billingModuleCurrencyId: selection.currencyId,
            },
          });
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
