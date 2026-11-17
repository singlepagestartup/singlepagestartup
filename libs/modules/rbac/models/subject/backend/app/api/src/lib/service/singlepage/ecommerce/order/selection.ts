import {
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds,
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
} from "@sps/shared-utils";
import type { IOfferQuote } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IModel as ILine } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type {
  IEcommerceCartSelection,
  IEcommerceCartSelectionInput,
  IEcommerceCartSelectionResult,
} from "@sps/rbac/models/subject/sdk/model";
import type { Repository } from "../../../../repository";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  data: IEcommerceCartSelectionInput;
}
export interface IQuoteProps {
  subjectId: string;
  selections: IEcommerceCartSelection[];
  excludeOrderIds?: string[];
  preparedQuotes?: IOfferQuote[];
}
export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "subjectsToEcommerceModuleOrders"
    | "ecommerceModuleOrderAssertAccess"
  >;
}

export class Service {
  private readonly quotedAvailability = new Map<string, number>();
  private preparedQuotes: IOfferQuote[] = [];

  constructor(private readonly dependencies: IConstructorProps) {}

  async quote(props: IQuoteProps): Promise<IOfferQuote[]> {
    this.quotedAvailability.clear();
    for (const selection of props.selections) {
      const quantities = [
        selection.quantity,
        ...(selection.services ?? []).map((service) => service.quantity),
      ];
      if (
        quantities.some(
          (quantity) =>
            !Number.isSafeInteger(quantity) ||
            quantity < 1 ||
            quantity > quantityBounds.max,
        )
      ) {
        throw new Error(
          `Validation error. Quantity must be an integer between 1 and ${quantityBounds.max}`,
        );
      }
      const selectedServices = (selection.services ?? []).map(
        (service) => service.offerId,
      );
      if (new Set(selectedServices).size !== selectedServices.length) {
        throw new Error(
          "Validation error. Each service offer can be selected only once",
        );
      }
    }
    // Route/geocoding work happens before the caller enters a write lock.
    const quotes =
      props.preparedQuotes ??
      (await this.dependencies.service.ecommerceModule.storesToProducts.quoteMany(
        props.selections,
      ));
    this.preparedQuotes = quotes;
    const existing = await this.otherCartQuantities(props);
    const requested = new Map<string, number>();
    for (const selection of props.selections) {
      requested.set(
        selection.offerId,
        (requested.get(selection.offerId) ?? 0) + selection.quantity,
      );
      for (const service of selection.services ?? []) {
        requested.set(
          service.offerId,
          (requested.get(service.offerId) ?? 0) + service.quantity,
        );
      }
    }
    return quotes.map((quote) => {
      const issues = [...quote.issues];
      let availableQuantity = quote.availableQuantity;
      if (availableQuantity !== null) {
        this.quotedAvailability.set(quote.offerId, availableQuantity);
        availableQuantity = Math.max(
          0,
          availableQuantity - (existing.get(quote.offerId) ?? 0),
        );
        if (
          (requested.get(quote.offerId) ?? 0) > availableQuantity &&
          !issues.some(
            (issue) =>
              issue.code === "insufficient_stock" &&
              issue.offerId === quote.offerId,
          )
        ) {
          issues.push({
            code: "insufficient_stock",
            offerId: quote.offerId,
            available: availableQuantity,
            message: `Requested quantity exceeds available stock (${availableQuantity}) across this cart`,
          });
        }
      }
      for (const charge of quote.charges) {
        if (charge.role === "product" || charge.availableQuantity === null) {
          continue;
        }
        this.quotedAvailability.set(charge.offerId, charge.availableQuantity);
        const available = Math.max(
          0,
          charge.availableQuantity - (existing.get(charge.offerId) ?? 0),
        );
        if (
          (requested.get(charge.offerId) ?? 0) > available &&
          !issues.some(
            (issue) =>
              issue.code === "insufficient_stock" &&
              issue.offerId === charge.offerId,
          )
        ) {
          issues.push({
            code: "insufficient_stock",
            offerId: charge.offerId,
            available,
            message: `Selected service exceeds available stock (${available}) across this cart`,
          });
        }
      }
      return {
        ...quote,
        availableQuantity,
        issues,
        amount: issues.length ? null : quote.amount,
      };
    });
  }

  async execute(props: IExecuteProps): Promise<IEcommerceCartSelectionResult> {
    const { service, repository } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess({
      subjectId: props.subjectId,
      orderId: props.orderId,
      lineIds: [props.data.lineId],
    });
    const before = await this.readEditable(props);
    const primary = before.find((line) => line.id === props.data.lineId);
    if (!primary || primary.parentLineId) {
      throw new Error("Validation error. Select a primary cart line");
    }
    if (before.filter((line) => !line.parentLineId).length !== 1) {
      throw new Error(
        "Conflict error. Choose a store for each legacy product before splitting this order",
      );
    }
    const product = await service.ecommerceModule.product.findById({
      id: primary.productId,
    });
    if (!product || product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG) {
      throw new Error(
        "Permission error. This product cannot be edited through the cart",
      );
    }
    if (
      props.data.selections.length > 1 &&
      props.data.selections.reduce(
        (quantity, selection) => quantity + selection.quantity,
        0,
      ) !== primary.quantity
    ) {
      throw new Error(
        "Validation error. Split quantities must equal the original quantity",
      );
    }
    const sourceOffer = primary.offerId
      ? await service.ecommerceModule.storesToProducts.findById({
          id: primary.offerId,
        })
      : null;
    const targets = await service.ecommerceModule.storesToProducts.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: props.data.selections.map(
                (selection) => selection.offerId,
              ),
            },
          ],
        },
      },
    });
    for (const selection of props.data.selections) {
      const target = targets.find((offer) => offer.id === selection.offerId);
      if (
        !target ||
        target.productId !== primary.productId ||
        (sourceOffer &&
          sourceOffer.configurationKey !== target.configurationKey)
      ) {
        throw new Error(
          "Validation error. Comparison requires the same product and configuration",
        );
      }
    }
    const quotes = await this.quote({
      subjectId: props.subjectId,
      excludeOrderIds: [props.orderId],
      selections: props.data.selections,
    });
    if (props.data.action === "preview") {
      const comparisonQuotes: IOfferQuote[] = [];
      if (sourceOffer) {
        for (let index = 0; index < props.data.selections.length; index += 1) {
          const selection = props.data.selections[index];
          const targetQuote = quotes[index];
          if (selection.offerId === sourceOffer.id) {
            comparisonQuotes.push(targetQuote);
            continue;
          }
          const source = await service.ecommerceModule.storesToProducts.quote({
            ...selection,
            offerId: sourceOffer.id,
            services: [],
          });
          const services: NonNullable<IEcommerceCartSelection["services"]> = [];
          for (const selected of selection.services ?? []) {
            const target = targetQuote.serviceOptions.find(
              (option) => option.offerId === selected.offerId,
            );
            const candidates = source.serviceOptions.filter(
              (option) =>
                option.productId === target?.productId &&
                option.role === target?.role,
            );
            if (candidates.length === 1) {
              services.push({
                offerId: candidates[0].offerId,
                quantity: selected.quantity,
              });
            }
          }
          const previous = await service.ecommerceModule.storesToProducts.quote(
            { ...selection, offerId: sourceOffer.id, services },
          );
          comparisonQuotes.push(previous);
        }
      }
      return {
        quotes,
        comparisonQuotes,
        orderIds: [props.orderId],
        applied: false,
      };
    }
    if (
      !props.data.expectedSelectionUpdatedAt ||
      new Date(primary.selectionUpdatedAt).getTime() !==
        new Date(props.data.expectedSelectionUpdatedAt).getTime()
    ) {
      throw new Error(
        "Conflict error. Cart selection changed. Reload and compare again",
      );
    }
    if (
      props.data.expectedVersions?.length !== quotes.length ||
      quotes.some(
        (quote, index) =>
          quote.version !== props.data.expectedVersions?.[index],
      )
    ) {
      throw new Error(
        "Conflict error. Offer terms changed. Preview and confirm the new price",
      );
    }
    if (quotes.some((quote) => quote.amount === null || quote.issues.length)) {
      throw new Error(
        "Validation error. Complete the selection and resolve quote issues before saving",
      );
    }
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        await service.ecommerceModule.order.lockForLifecycle({
          id: props.orderId,
        });
        const current = await this.readEditable(props);
        const currentPrimary = current.find((line) => line.id === primary.id);
        if (
          !currentPrimary ||
          new Date(currentPrimary.selectionUpdatedAt).getTime() !==
            new Date(primary.selectionUpdatedAt).getTime()
        ) {
          throw new Error(
            "Conflict error. Cart selection changed. Reload and compare again",
          );
        }
        if (
          quotes.some(
            (quote) => new Date(quote.expiresAt).getTime() <= Date.now(),
          )
        ) {
          throw new Error(
            "Conflict error. Quote expired. Preview and confirm the current price",
          );
        }
        await service.ecommerceModule.ordersToBillingModulePaymentIntents.lockOffers(
          {
            offerIds: [
              ...new Set(
                props.data.selections.flatMap((selection) => [
                  selection.offerId,
                  ...(selection.services ?? []).map(
                    (selected) => selected.offerId,
                  ),
                ]),
              ),
            ],
          },
        );
        let currentQuotes: IOfferQuote[];
        try {
          currentQuotes =
            await service.ecommerceModule.storesToProducts.quotesUnderLock(
              props.data.selections,
              this.preparedQuotes,
            );
        } catch (error) {
          throw new Error(
            "Conflict error. Offer terms changed. Preview and confirm the current price",
            { cause: error },
          );
        }
        this.quotedAvailability.clear();
        for (const quote of currentQuotes) {
          if (quote.availableQuantity !== null) {
            this.quotedAvailability.set(quote.offerId, quote.availableQuantity);
          }
          for (const charge of quote.charges) {
            if (charge.availableQuantity !== null) {
              this.quotedAvailability.set(
                charge.offerId,
                charge.availableQuantity,
              );
            }
          }
        }
        const otherQuantities = await this.otherCartQuantities({
          subjectId: props.subjectId,
          selections: props.data.selections,
          excludeOrderIds: [props.orderId],
        });
        const requested = new Map<string, number>();
        for (const selection of props.data.selections) {
          requested.set(
            selection.offerId,
            (requested.get(selection.offerId) ?? 0) + selection.quantity,
          );
          for (const selected of selection.services ?? []) {
            requested.set(
              selected.offerId,
              (requested.get(selected.offerId) ?? 0) + selected.quantity,
            );
          }
        }
        for (const [offerId, available] of this.quotedAvailability) {
          if (
            (requested.get(offerId) ?? 0) +
              (otherQuantities.get(offerId) ?? 0) >
            available
          ) {
            throw new Error(
              "Conflict error. Quantity exceeds available stock across the cart",
            );
          }
        }
        const orderIds = [props.orderId];
        for (let index = 0; index < props.data.selections.length; index += 1) {
          const selection = props.data.selections[index];
          const quote = quotes[index];
          let orderId = props.orderId;
          if (index > 0) {
            const order = await service.ecommerceModule.order.create({
              data: {},
            });
            if (!order) {
              throw new Error(
                "Internal error. Failed to create split cart order",
              );
            }
            orderId = order.id;
            await service.subjectsToEcommerceModuleOrders.create({
              data: {
                subjectId: props.subjectId,
                ecommerceModuleOrderId: orderId,
              },
            });
            orderIds.push(orderId);
          }
          await this.persistSelection({
            orderId,
            selection,
            quote,
            primary: index === 0 ? currentPrimary : undefined,
            previousLines: index === 0 ? current : [],
          });
        }
        return { quotes, orderIds, applied: true };
      },
    );
  }

  private async readEditable(props: {
    subjectId: string;
    orderId: string;
  }): Promise<ILine[]> {
    const { service } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess(props);
    const owners = await service.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
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
      !owners.length ||
      owners.some((owner) => owner.subjectId !== props.subjectId)
    ) {
      throw new Error(
        "Permission error. Order must belong only to the current subject",
      );
    }
    const order = await service.ecommerceModule.order.findById({
      id: props.orderId,
    });
    const payments =
      await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: props.orderId }],
          },
        },
      });
    if (
      !order ||
      order.type !== "cart" ||
      order.status !== "new" ||
      payments.length
    ) {
      throw new Error(
        "Conflict error. Only an editable cart order can change selection",
      );
    }
    return service.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: props.orderId }],
        },
      },
    });
  }

  private async otherCartQuantities(
    props: IQuoteProps,
  ): Promise<Map<string, number>> {
    const { service } = this.dependencies;
    const links = await service.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: props.subjectId }],
        },
      },
    });
    const orderIds = links
      .map((link) => link.ecommerceModuleOrderId)
      .filter((id) => !props.excludeOrderIds?.includes(id));
    const quantities = new Map<string, number>();
    if (!orderIds.length) {
      return quantities;
    }
    const orders = await service.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: orderIds },
            { column: "type", method: "eq", value: "cart" },
            { column: "status", method: "eq", value: "new" },
          ],
        },
      },
    });
    if (!orders.length) {
      return quantities;
    }
    const paymentLinks =
      await service.ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "inArray",
                value: orders.map((order) => order.id),
              },
            ],
          },
        },
      });
    const editableIds = orders
      .filter(
        (order) =>
          !paymentLinks.some((payment) => payment.orderId === order.id),
      )
      .map((order) => order.id);
    if (!editableIds.length) {
      return quantities;
    }
    const lines = await service.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "inArray", value: editableIds }],
        },
      },
    });
    for (const line of lines) {
      if (line.offerId) {
        quantities.set(
          line.offerId,
          (quantities.get(line.offerId) ?? 0) + line.quantity,
        );
      }
    }
    return quantities;
  }

  private async persistSelection(props: {
    orderId: string;
    selection: IEcommerceCartSelection;
    quote: IOfferQuote;
    primary?: ILine;
    previousLines: ILine[];
  }) {
    const { service } = this.dependencies;
    const timestamp = new Date();
    const data = {
      orderId: props.orderId,
      productId: props.quote.productId,
      offerId: props.selection.offerId,
      quantity: props.selection.quantity,
      destination: props.selection.destination ?? {},
      selectionUpdatedAt: timestamp,
      quoteVersion: props.quote.version,
      quoteExpiresAt: new Date(props.quote.expiresAt),
    };
    let primary: ILine | null | undefined;
    if (props.primary) {
      primary = await service.ecommerceModule.ordersToProducts.update({
        id: props.primary.id,
        data,
      });
    } else {
      primary = await service.ecommerceModule.ordersToProducts.create({ data });
    }
    if (!primary) {
      throw new Error("Internal error. Failed to save primary cart line");
    }
    const primaryId = primary.id;
    for (const child of props.previousLines.filter(
      (line) => line.parentLineId === primaryId,
    )) {
      await service.ecommerceModule.ordersToProducts.delete({ id: child.id });
    }
    for (const selected of props.selection.services ?? []) {
      const charge = props.quote.charges.find(
        (charge) =>
          charge.offerId === selected.offerId && charge.role !== "product",
      );
      if (!charge) {
        throw new Error(
          "Validation error. Selected service has no quoted charge",
        );
      }
      await service.ecommerceModule.ordersToProducts.create({
        data: {
          orderId: props.orderId,
          productId: charge.productId,
          offerId: selected.offerId,
          parentLineId: primaryId,
          quantity: selected.quantity,
          recurrence: charge.recurrence,
          selectionUpdatedAt: timestamp,
        },
      });
    }
    const stores = await service.ecommerceModule.storesToOrders.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: props.orderId }],
        },
      },
    });
    const selectedStore =
      stores.find(
        (store: { storeId: string }) => store.storeId === props.quote.storeId,
      ) ?? stores[0];
    if (selectedStore) {
      if (selectedStore.storeId !== props.quote.storeId) {
        await service.ecommerceModule.storesToOrders.update({
          id: selectedStore.id,
          data: { storeId: props.quote.storeId },
        });
      }
      for (const store of stores) {
        if (store.id !== selectedStore.id) {
          await service.ecommerceModule.storesToOrders.delete({ id: store.id });
        }
      }
    } else {
      await service.ecommerceModule.storesToOrders.create({
        data: { orderId: props.orderId, storeId: props.quote.storeId },
      });
    }
    const currencies =
      await service.ecommerceModule.ordersToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: props.orderId }],
          },
        },
      });
    const selectedCurrency =
      currencies.find(
        (currency: { billingModuleCurrencyId: string }) =>
          currency.billingModuleCurrencyId === props.selection.currencyId,
      ) ?? currencies[0];
    if (selectedCurrency) {
      if (
        selectedCurrency.billingModuleCurrencyId !== props.selection.currencyId
      ) {
        await service.ecommerceModule.ordersToBillingModuleCurrencies.update({
          id: selectedCurrency.id,
          data: { billingModuleCurrencyId: props.selection.currencyId },
        });
      }
      for (const currency of currencies) {
        if (currency.id !== selectedCurrency.id) {
          await service.ecommerceModule.ordersToBillingModuleCurrencies.delete({
            id: currency.id,
          });
        }
      }
    } else {
      await service.ecommerceModule.ordersToBillingModuleCurrencies.create({
        data: {
          orderId: props.orderId,
          billingModuleCurrencyId: props.selection.currencyId,
        },
      });
    }
  }
}
