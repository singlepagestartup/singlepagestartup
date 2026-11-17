import type { IOrderLineTotals } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { Repository as OfferRepository } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/repository";
import { Configuration as OfferConfiguration } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/configuration";
import { Service as OfferService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service";
import type { IOfferQuoteInput } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import { Repository } from "../../repository";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as GetTotalService } from "../startup/get-total";
import type { IExecuteProps as IGetTotalExecuteProps } from "./get-total";
import { OrdersToProductsDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  product: ProductService;
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(OrdersToProductsDI.IProductsService) product: ProductService,
    @inject(OrdersToProductsDI.IAttributesService) attribute: AttributeService,
    @inject(OrdersToProductsDI.IAttributeKeysService)
    attributeKey: AttributeKeyService,
    @inject(OrdersToProductsDI.IProductsToAttributesService)
    productsToAttributes: ProductsToAttributesService,
    @inject(OrdersToProductsDI.IAttributeKeysToAttributesService)
    attributeKeysToAttributes: AttributeKeysToAttributesService,
    @inject(OrdersToProductsDI.IAttributesToBillingModuleCurrenciesService)
    attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService,
  ) {
    super(repository);
    this.product = product;
    this.attribute = attribute;
    this.attributeKey = attributeKey;
    this.productsToAttributes = productsToAttributes;
    this.attributeKeysToAttributes = attributeKeysToAttributes;
    this.attributesToBillingModuleCurrencies =
      attributesToBillingModuleCurrencies;
  }

  private offerService?: OfferService;
  get offers() {
    this.offerService ??= new OfferService(
      new OfferRepository(new OfferConfiguration()),
    );
    return this.offerService;
  }

  offerSelection(
    lines: (typeof Table.$inferSelect)[],
    currencyId: string,
  ): IOfferQuoteInput {
    const mains = lines.filter((line) => !line.parentLineId);
    const main = mains[0];
    if (
      mains.length !== 1 ||
      !main?.offerId ||
      lines.some(
        (line) =>
          !line.offerId || (line.parentLineId && line.parentLineId !== main.id),
      )
    ) {
      throw new Error(
        "Conflict error. Choose a retail offer for each cart position",
      );
    }
    return {
      lineId: main.id,
      offerId: main.offerId,
      currencyId,
      quantity: main.quantity,
      destination: main.destination,
      services: lines
        .filter((line) => line.parentLineId === main.id)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((line) => ({
          lineId: line.id,
          offerId: line.offerId!,
          quantity: line.quantity,
        })),
    };
  }

  async offerTotals(lines: (typeof Table.$inferSelect)[], lineId?: string) {
    const input = this.offerSelection(lines, "");
    const quotes = await this.offers.quoteCurrencies(input);
    const totals: IOrderLineTotals["totals"] = [];
    for (const { quote, currency } of quotes) {
      if (quote.amount === null) {
        continue;
      }
      const amount = lineId
        ? quote.charges.find((charge) => charge.lineId === lineId)?.amount
        : quote.amount;
      if (amount !== undefined) {
        totals.push({ total: Number(amount), billingModuleCurrency: currency });
      }
    }
    const unpriced: IOrderLineTotals["unpriced"] = [];
    if (!totals.length) {
      const primary = lines.find(
        (line) => line.id === (lineId ?? input.lineId),
      )!;
      unpriced.push({
        ordersToProductsId: primary.id,
        productId: primary.productId,
        reason:
          quotes[0]?.quote.issues[0]?.message ?? "No available offer price",
      });
    }
    return {
      totals,
      unpriced,
      availableCurrencyIds: quotes[0]?.quote.currencyIds ?? [],
    };
  }

  async getTotal(props: IGetTotalExecuteProps) {
    const entity = await this.findById({ id: props.id });
    if (entity?.offerId) {
      const lines = await this.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: entity.orderId }],
          },
        },
      });
      return this.offerTotals(lines, entity.id);
    }
    return new GetTotalService({
      findById: async () => entity,
      product: this.product,
      billingModule: this.product.billingModule,
      attribute: this.attribute,
      attributeKey: this.attributeKey,
      productsToAttributes: this.productsToAttributes,
      attributeKeysToAttributes: this.attributeKeysToAttributes,
      attributesToBillingModuleCurrencies:
        this.attributesToBillingModuleCurrencies,
    }).execute(props);
  }
}
