import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { currencyPrecision } from "@sps/billing/models/currency/sdk/model";
import { Table } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import type { Service as ReservationsService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/service";
import { OfferDI } from "../../di";
import { Service as Catalog } from "./catalog";
import type {
  IAddressSuggestionsInput,
  IOfferQuoteInput,
  IOfferQuote,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { Repository } from "../../repository";
import { Service as Quote } from "./quote";
import { Service as AddressSuggestions } from "./address-suggestions";
import {
  deliveryRouting,
  QuoteRoutes,
  type IDeliveryRouting,
} from "./quote/routing";

export interface IQuoteOptions {
  fulfilledLineIds?: readonly string[];
}

const previewRoutes = new WeakMap<IOfferQuote, QuoteRoutes>();

@injectable()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  constructor(
    @inject(DI.IRepository) readonly repository: Repository,
    @inject(OfferDI.ICatalogService) readonly catalog: Catalog,
    @inject(OfferDI.IReservationsService)
    readonly reservations: Pick<ReservationsService, "reservedQuantities">,
  ) {
    super(repository);
  }

  protected resolveDeliveryRouting(): IDeliveryRouting {
    return deliveryRouting();
  }

  async addressSuggestions(
    input: IAddressSuggestionsInput,
    signal?: AbortSignal,
  ) {
    return new AddressSuggestions({
      catalog: this.catalog,
      routing: () => this.resolveDeliveryRouting(),
    }).execute(input, signal);
  }

  async quote(input: IOfferQuoteInput, options: IQuoteOptions = {}) {
    const [quote] = await this.quoteMany([input], options);
    return quote;
  }

  async quoteMany(
    inputs: IOfferQuoteInput[],
    options: IQuoteOptions = {},
  ): Promise<IOfferQuote[]> {
    const routes = new QuoteRoutes(() => this.resolveDeliveryRouting());
    const quotes = await this.calculateMany(
      inputs,
      inputs.map(() => routes),
      options,
    );
    routes.freeze();
    for (const quote of quotes) {
      previewRoutes.set(quote, routes);
    }
    return quotes;
  }

  async quoteUnderLock(
    input: IOfferQuoteInput,
    preview: IOfferQuote,
    options: IQuoteOptions = {},
  ) {
    const [current] = await this.quotesUnderLock([input], [preview], options);
    return current;
  }

  async quotesUnderLock(
    inputs: IOfferQuoteInput[],
    previews: IOfferQuote[],
    options: IQuoteOptions & { allowIncompleteDelivery?: boolean } = {},
  ) {
    if (inputs.length !== previews.length) {
      throw new Error("Conflict error. Missing offer quote");
    }
    const routes = previews.map((preview) => {
      const evidence = previewRoutes.get(preview);
      if (!evidence || Date.parse(preview.expiresAt) <= Date.now()) {
        throw new Error("Conflict error. Offer quote expired");
      }
      return evidence;
    });
    const current = await this.calculateMany(inputs, routes, options);
    for (const [index, quote] of current.entries()) {
      const hasBlockingIssue = quote.issues.some(
        (issue) =>
          !options.allowIncompleteDelivery || issue.code !== "address_required",
      );
      if (quote.version !== previews[index].version || hasBlockingIssue) {
        throw new Error("Conflict error. Offer conditions changed");
      }
    }
    return current;
  }

  private async calculateMany(
    inputs: IOfferQuoteInput[],
    routes: QuoteRoutes[],
    options: IQuoteOptions,
  ) {
    if (!inputs.length) {
      return [];
    }
    const catalog = await this.catalog.catalog(
      inputs.map((input) => input.offerId),
    );
    const held = await this.reservations.reservedQuantities({
      offerIds: [...catalog.offers.keys()],
    });
    const now = new Date();
    const results: IOfferQuote[] = [];
    for (const [index, input] of inputs.entries()) {
      const calculator = new Quote({
        catalog,
        held,
        now,
        routing: () => routes[index],
        precision: currencyPrecision,
        fulfillmentAlreadySatisfied: Boolean(
          input.lineId && options.fulfilledLineIds?.includes(input.lineId),
        ),
      });
      results.push(await calculator.execute(input));
    }
    return results;
  }

  async quoteCurrencies(input: IOfferQuoteInput, options: IQuoteOptions = {}) {
    const catalog = await this.catalog.catalog(input.offerId);
    const held = await this.reservations.reservedQuantities({
      offerIds: [...catalog.offers.keys()],
    });
    const routes = new QuoteRoutes(() => this.resolveDeliveryRouting());
    const calculator = new Quote({
      catalog,
      held,
      now: new Date(),
      routing: () => routes,
      precision: currencyPrecision,
      fulfillmentAlreadySatisfied: Boolean(
        input.lineId && options.fulfilledLineIds?.includes(input.lineId),
      ),
    });
    const results: {
      quote: IOfferQuote;
      currency: (typeof catalog.currencies)[number];
    }[] = [];
    for (const currency of catalog.currencies) {
      const quote = await calculator.execute({
        ...input,
        currencyId: currency.id,
      });
      results.push({ quote, currency });
    }
    return results;
  }

  async purchaseTerms(input: IOfferQuoteInput, includeAmount: boolean) {
    const catalog = await this.catalog.catalog(input.offerId);
    const offer = catalog.offers.get(input.offerId);
    const product = offer && catalog.products.get(offer.productId);
    if (!product) {
      throw new Error("Not Found error. Retail product is unavailable");
    }
    const intervals = (catalog.productAttributes.get(product.id) ?? []).filter(
      (attr) => attr.type === "interval",
    );
    if (
      product.type === "subscription" &&
      (intervals.length !== 1 || !intervals[0].text)
    ) {
      throw new Error("Validation error. Invalid subscription interval");
    }
    let amount = 0;
    if (includeAmount) {
      const quote = await this.quote(input);
      if (quote.amount === null) {
        throw new Error(
          "Conflict error. " +
            (quote.issues[0]?.message ?? "Offer is unavailable"),
        );
      }
      amount = Number(quote.amount);
    }
    return { amount, type: product.type, interval: intervals[0]?.text };
  }

  async offersForProduct(props: {
    productId: string;
    storeId?: string;
    configurationKey?: string;
  }) {
    const filters = [
      { column: "productId", method: "eq" as const, value: props.productId },
      { column: "variant", method: "eq" as const, value: "default" },
    ];
    if (props.storeId) {
      filters.push({ column: "storeId", method: "eq", value: props.storeId });
    }
    if (props.configurationKey !== undefined) {
      filters.push({
        column: "configurationKey",
        method: "eq",
        value: props.configurationKey,
      });
    }
    return this.find({ params: { filters: { and: filters } } });
  }
}
