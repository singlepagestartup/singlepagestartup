import { createModule } from "../module";
import { createModules } from "@sps/ecommerce/backend/app/api/src/lib/modules";
import type { IOrderLineTotals } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { Service as OfferService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service";
import type { IQuoteOptions } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service/singlepage";
import type { IOfferQuoteInput } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import { Repository } from "../../repository";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as GetTotalService } from "../startup/get-total";
import type { IExecuteProps as IGetTotalExecuteProps } from "./get-total";
import { OrdersToProductsDI } from "../../di";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(OrdersToProductsDI.IAttributeKeysService)
    private readonly attributeKey: AttributeKeyService,
    @inject(OrdersToProductsDI.IOffersService) readonly offers: OfferService,
  ) {
    super(repository);
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

  async offerTotals(
    lines: (typeof Table.$inferSelect)[],
    lineId?: string,
    options: IQuoteOptions = {},
  ) {
    const input = this.offerSelection(lines, "");
    const quotes = await this.offers.quoteCurrencies(input, options);
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
      availableCurrencyIds: [
        ...new Set(quotes.flatMap(({ quote }) => quote.currencyIds)),
      ].sort(),
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
    const { product } = this.module;
    const { attribute, productsToAttributes } = product.module;
    return new GetTotalService({
      findById: async () => entity,
      product,
      currency: this.modules.billing.currency,
      attribute,
      attributeKey: this.attributeKey,
      productsToAttributes,
      attributeKeysToAttributes:
        this.attributeKey.module.attributeKeysToAttributes,
      attributesToBillingModuleCurrencies:
        attribute.module.attributesToBillingModuleCurrencies,
    }).execute(props);
  }
}
