import { Service as InitialGrantProducts } from "../../billing/initial-grant-products";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import type {
  IOfferQuote,
  IOfferQuoteInput,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IModel as ILine } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type {
  IEcommerceCartSelection,
  IEcommerceCartSelectionInput,
  IEcommerceCartSelectionResult,
} from "@sps/rbac/models/subject/sdk/model";
import type { Repository } from "../../../../repository";
import type { SubjectServiceDependencies } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orderId: string;
  data: IEcommerceCartSelectionInput;
}
export interface IQuoteProps {
  subjectId: string;
  selections: IOfferQuoteInput[];
  excludeOrderIds?: string[];
  preparedQuotes?: IOfferQuote[];
  fulfilledLineIds?: readonly string[];
}
export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  service: SubjectServiceDependencies<"ecommerceModuleOrderAssertAccess">;
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
    let quotes = props.preparedQuotes;
    if (!quotes) {
      if (props.fulfilledLineIds?.length) {
        quotes =
          await this.dependencies.service.modules.ecommerce.storesToProducts.quoteMany(
            props.selections,
            { fulfilledLineIds: props.fulfilledLineIds },
          );
      } else {
        quotes =
          await this.dependencies.service.modules.ecommerce.storesToProducts.quoteMany(
            props.selections,
          );
      }
    }
    if (quotes.length !== props.selections.length) {
      throw new Error("Configuration error. Cart quote batch is incomplete");
    }
    this.preparedQuotes = quotes;
    const existing = await this.otherCartQuantities(props);
    const requested = new Map<string, number>();
    for (const [index, selection] of props.selections.entries()) {
      requested.set(
        selection.offerId,
        (requested.get(selection.offerId) ?? 0) + selection.quantity,
      );
      for (const service of quotes[index].selectedServices ??
        selection.services ??
        []) {
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
    if (props.data.selections.length !== 1) {
      throw new Error(
        "Validation error. A cart line must have exactly one fulfillment selection",
      );
    }
    await service.ecommerceModuleOrderAssertAccess({
      subjectId: props.subjectId,
      orderId: props.orderId,
      lineIds: [props.data.lineId],
    });
    const editable = await this.readEditable(props);
    const before = editable.lines;
    const primary = before.find((line) => line.id === props.data.lineId);
    if (!primary || primary.parentLineId) {
      throw new Error("Validation error. Select a primary cart line");
    }
    if (before.filter((line) => !line.parentLineId).length !== 1) {
      throw new Error(
        "Conflict error. Choose a store for each product in this older cart before editing its selection",
      );
    }
    const product = await service.modules.ecommerce.product.findById({
      id: primary.productId,
    });
    if (
      !product ||
      (await new InitialGrantProducts(
        service.modules.ecommerce.storesToProducts,
      ).includes(product.id))
    ) {
      throw new Error(
        "Permission error. This product cannot be edited through the cart",
      );
    }
    const sourceOffer = primary.offerId
      ? await service.modules.ecommerce.storesToProducts.findById({
          id: primary.offerId,
        })
      : null;
    const targets = await service.modules.ecommerce.storesToProducts.find({
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
    const quoteOptions = editable.fulfilledLineIds.length
      ? { fulfilledLineIds: editable.fulfilledLineIds }
      : undefined;
    const inputs = props.data.selections.map((selection) => ({
      ...selection,
      lineId: primary.id,
    }));
    const quotes = await this.quote({
      subjectId: props.subjectId,
      excludeOrderIds: [props.orderId],
      selections: inputs,
      ...quoteOptions,
    });
    const selections = inputs.map((selection, index) => ({
      ...selection,
      services: quotes[index].selectedServices ?? selection.services,
    }));
    if (props.data.action === "preview") {
      const comparisonQuotes: IOfferQuote[] = [];
      if (sourceOffer) {
        for (let index = 0; index < selections.length; index += 1) {
          const selection = selections[index];
          const targetQuote = quotes[index];
          if (selection.offerId === sourceOffer.id) {
            comparisonQuotes.push(targetQuote);
            continue;
          }
          const source = await service.modules.ecommerce.storesToProducts.quote(
            { ...selection, offerId: sourceOffer.id, services: [] },
            quoteOptions,
          );
          const services: NonNullable<IEcommerceCartSelection["services"]> = [];
          for (const selected of selection.services ?? []) {
            const compatible = source.serviceOptions.some(
              (option) =>
                option.offerId === selected.offerId ||
                option.compatibleOfferIds?.includes(selected.offerId),
            );
            if (compatible) {
              services.push({
                offerId: selected.offerId,
                quantity: selected.quantity,
              });
            }
          }
          const previous =
            await service.modules.ecommerce.storesToProducts.quote(
              { ...selection, offerId: sourceOffer.id, services },
              quoteOptions,
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
      props.data.action === "apply" &&
      (props.data.expectedVersions?.length !== quotes.length ||
        quotes.some(
          (quote, index) =>
            quote.version !== props.data.expectedVersions?.[index],
        ))
    ) {
      throw new Error(
        "Conflict error. Offer terms changed. Preview and confirm the new price",
      );
    }
    if (quotes.some((quote) => quote.amount === null || quote.issues.length)) {
      if (props.data.action === "save") {
        return { quotes, orderIds: [], applied: false };
      }
      throw new Error(
        "Validation error. Complete the selection and resolve quote issues before saving",
      );
    }
    return repository.withSubjectLock(
      { subjectId: props.subjectId },
      async () => {
        await service.modules.ecommerce.order.lockForLifecycle({
          id: props.orderId,
        });
        const currentEditable = await this.readEditable(props);
        const current = currentEditable.lines;
        const currentQuoteOptions = currentEditable.fulfilledLineIds.length
          ? { fulfilledLineIds: currentEditable.fulfilledLineIds }
          : undefined;
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
        await service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.lockOffers(
          {
            offerIds: [
              ...new Set(
                selections.flatMap((selection) => [
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
            await service.modules.ecommerce.storesToProducts.quotesUnderLock(
              selections,
              this.preparedQuotes,
              currentQuoteOptions,
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
          selections,
          excludeOrderIds: [props.orderId],
        });
        const requested = new Map<string, number>();
        for (const selection of selections) {
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
        const timestamp = new Date(
          Math.max(
            Date.now(),
            new Date(currentPrimary.selectionUpdatedAt).getTime() + 1,
          ),
        );
        await this.persistSelection({
          orderId: props.orderId,
          timestamp,
          selection: selections[0],
          quote: currentQuotes[0],
          primary: currentPrimary,
          previousLines: current,
        });
        return {
          quotes,
          orderIds,
          applied: true,
          ...(props.data.action === "save" && {
            selectionUpdatedAt: timestamp.toISOString(),
          }),
        };
      },
    );
  }

  private async readEditable(props: {
    subjectId: string;
    orderId: string;
  }): Promise<{ lines: ILine[]; fulfilledLineIds: string[] }> {
    const { service } = this.dependencies;
    await service.ecommerceModuleOrderAssertAccess(props);
    const owners = await service.module.subjectsToEcommerceModuleOrders.find({
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
    const order = await service.modules.ecommerce.order.findById({
      id: props.orderId,
    });
    const payments =
      await service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find(
        {
          params: {
            filters: {
              and: [{ column: "orderId", method: "eq", value: props.orderId }],
            },
          },
        },
      );
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
    const lines = await service.modules.ecommerce.ordersToProducts.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "eq", value: props.orderId }],
        },
      },
    });
    let fulfilledLineIds: string[] = [];
    if (order.subscriptionSourceOrderId) {
      const fulfillment =
        await service.modules.ecommerce.order.fulfillmentQuoteOptions({
          id: order.id,
        });
      fulfilledLineIds = fulfillment.fulfilledLineIds;
    }
    return { lines, fulfilledLineIds };
  }

  private async otherCartQuantities(
    props: IQuoteProps,
  ): Promise<Map<string, number>> {
    const { service } = this.dependencies;
    const links = await service.module.subjectsToEcommerceModuleOrders.find({
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
    const orders = await service.modules.ecommerce.order.find({
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
      await service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find(
        {
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
        },
      );
    const editableIds = orders
      .filter(
        (order) =>
          !paymentLinks.some((payment) => payment.orderId === order.id),
      )
      .map((order) => order.id);
    if (!editableIds.length) {
      return quantities;
    }
    const lines = await service.modules.ecommerce.ordersToProducts.find({
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
    timestamp: Date;
    selection: IEcommerceCartSelection;
    quote: IOfferQuote;
    primary: ILine;
    previousLines: ILine[];
  }) {
    const { service } = this.dependencies;
    const { timestamp } = props;
    const data = {
      orderId: props.orderId,
      productId: props.quote.productId,
      offerId: props.selection.offerId,
      quantity: props.selection.quantity,
      destination: props.quote.destination ?? props.selection.destination ?? {},
      selectionUpdatedAt: timestamp,
      quoteVersion: props.quote.version,
      quoteExpiresAt: new Date(props.quote.expiresAt),
    };
    const primary = await service.modules.ecommerce.ordersToProducts.update({
      id: props.primary.id,
      data,
    });
    if (!primary) {
      throw new Error("Internal error. Failed to save primary cart line");
    }
    const primaryId = primary.id;
    for (const child of props.previousLines.filter(
      (line) => line.parentLineId === primaryId,
    )) {
      await service.modules.ecommerce.ordersToProducts.delete({ id: child.id });
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
      await service.modules.ecommerce.ordersToProducts.create({
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
    const stores = await service.modules.ecommerce.storesToOrders.find({
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
        await service.modules.ecommerce.storesToOrders.update({
          id: selectedStore.id,
          data: { storeId: props.quote.storeId },
        });
      }
      for (const store of stores) {
        if (store.id !== selectedStore.id) {
          await service.modules.ecommerce.storesToOrders.delete({
            id: store.id,
          });
        }
      }
    } else {
      await service.modules.ecommerce.storesToOrders.create({
        data: { orderId: props.orderId, storeId: props.quote.storeId },
      });
    }
    const currencies =
      await service.modules.ecommerce.ordersToBillingModuleCurrencies.find({
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
        await service.modules.ecommerce.ordersToBillingModuleCurrencies.update({
          id: selectedCurrency.id,
          data: { billingModuleCurrencyId: props.selection.currencyId },
        });
      }
      for (const currency of currencies) {
        if (currency.id !== selectedCurrency.id) {
          await service.modules.ecommerce.ordersToBillingModuleCurrencies.delete(
            {
              id: currency.id,
            },
          );
        }
      }
    } else {
      await service.modules.ecommerce.ordersToBillingModuleCurrencies.create({
        data: {
          orderId: props.orderId,
          billingModuleCurrencyId: props.selection.currencyId,
        },
      });
    }
  }
}
