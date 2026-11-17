import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import { compileTariffFormula } from "@sps/backend-utils";
import type { IOfferAttribute, IOfferCatalog } from "../../../repository";
import type {
  IModel,
  IOfferCharge,
  IOfferQuoteInput,
  IOfferQuote,
  IOfferServiceOption,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IDeliveryRouting } from "./routing";

export function stockQuantity(attributes: IOfferAttribute[]): number | null {
  const stock = attributes.filter(
    (attribute) => attribute.key === "stock_quantity",
  );
  if (!stock.length) {
    return null;
  }
  const value = stock[0].number;
  if (
    stock.length !== 1 ||
    stock[0].field !== "number" ||
    stock[0].currencyIds.length ||
    value === null ||
    !/^\d+(?:\.0+)?$/.test(value) ||
    !Number.isSafeInteger(Number(value))
  ) {
    throw new Error("Invalid stock_quantity setting");
  }
  return Number(value);
}

function textSetting(attributes: IOfferAttribute[], key: string): string {
  const rows = attributes.filter((attribute) => attribute.key === key);
  if (rows.length !== 1 || !rows[0].text?.trim()) {
    throw new Error("Missing or ambiguous " + key);
  }
  return rows[0].text.trim();
}

function numberSetting(rows: IOfferAttribute[], name: string): string {
  if (
    rows.length !== 1 ||
    rows[0].number === null ||
    !/^\d+(?:\.\d+)?$/.test(rows[0].number) ||
    rows[0].field !== "number"
  ) {
    throw new Error("Missing or ambiguous " + name);
  }
  return rows[0].number;
}

function priceFor(rows: IOfferAttribute[], currencyId: string) {
  return numberSetting(
    rows.filter(
      (row) =>
        row.type === "price" &&
        row.currencyIds.length === 1 &&
        row.currencyIds[0] === currencyId,
    ),
    "unit_price",
  );
}

function coefficient(
  rows: IOfferAttribute[],
  name: string,
  currencyId: string,
) {
  const candidates = rows.filter((row) => row.key === name);
  const scoped = candidates.filter(
    (row) => row.currencyIds.length === 1 && row.currencyIds[0] === currencyId,
  );
  if (scoped.length || !name.endsWith("_percent")) {
    return numberSetting(scoped, name);
  }
  return numberSetting(
    candidates.filter((row) => !row.currencyIds.length),
    name,
  );
}

const measurementNames = [
  "length_cm",
  "width_cm",
  "height_cm",
  "weight_kg",
] as const;
function packageInput(offer: IModel, name: string, quantity: number): string {
  const packages = offer.settings.packages;
  if (
    !packages?.length ||
    packages.some((box) => !Number.isSafeInteger(box.count) || box.count < 1)
  ) {
    throw new Error("Missing package data for " + name);
  }
  const indexed =
    /^package_([1-9][0-9]*)_(length_cm|width_cm|height_cm|weight_kg|count)$/.exec(
      name,
    );
  if (indexed) {
    const box = packages[Number(indexed[1]) - 1];
    if (!box) {
      throw new Error("Missing package: " + indexed[1]);
    }
    const field = indexed[2] as keyof typeof box;
    const raw = String(box[field] ?? "");
    if (!/^\d+(?:\.\d+)?$/.test(raw) || new Decimal(raw).lte(0)) {
      throw new Error("Missing package measurement: " + name);
    }
    return raw;
  }
  let total = new Decimal(0);
  for (const box of packages) {
    const value = (key: (typeof measurementNames)[number]) => {
      if (
        !box[key] ||
        !/^\d+(?:\.\d+)?$/.test(box[key]) ||
        new Decimal(box[key]).lte(0)
      ) {
        throw new Error("Missing package measurement: " + key);
      }
      return new Decimal(box[key]);
    };
    if (name === "total_weight_kg") {
      total = total.plus(value("weight_kg").times(box.count).times(quantity));
    } else if (name === "total_volume_cm3") {
      total = total.plus(
        value("length_cm")
          .times(value("width_cm"))
          .times(value("height_cm"))
          .times(box.count)
          .times(quantity),
      );
    } else {
      const key = measurementNames.find((key) => key === name);
      if (!key || packages.length !== 1) {
        throw new Error(
          "Per-box dimension is ambiguous for multiple package types: " + name,
        );
      }
      return value(key).toFixed();
    }
  }
  return total.toFixed();
}

const runtimeInputs = new Set([
  "quantity",
  "serviced_qty",
  "serviced_subtotal",
  "distance_km",
  "unit_price",
  "total_weight_kg",
  "total_volume_cm3",
  ...measurementNames,
]);
function isRuntimeInput(name: string) {
  return (
    runtimeInputs.has(name) ||
    /^package_[1-9][0-9]*_(length_cm|width_cm|height_cm|weight_kg|count)$/.test(
      name,
    )
  );
}
interface IDependencies {
  catalog: IOfferCatalog;
  held: Record<string, number>;
  routing: () => IDeliveryRouting;
  precision: (currency: IOfferCatalog["currencies"][number]) => number;
  now: Date;
}

export class Service {
  constructor(private readonly deps: IDependencies) {}

  async execute(input: IOfferQuoteInput): Promise<IOfferQuote> {
    const { catalog, held, precision, now } = this.deps;
    const main = catalog.offers.get(input.offerId);
    if (
      !main ||
      !this.retail(main) ||
      (catalog.products.get(main.productId)?.kind === "service" &&
        !main.settings.standalone)
    ) {
      throw new Error("Not Found error. Retail offer is unavailable");
    }
    const currency = catalog.currencies.find(
      (entry) => entry.id === input.currencyId,
    );
    const attrs = (id: string) => catalog.offerAttributes.get(id) ?? [];
    const services = input.services ?? [];
    const result: IOfferQuote = {
      offerId: main.id,
      productId: main.productId,
      storeId: main.storeId,
      currencyId: input.currencyId,
      quantity: input.quantity,
      amount: null,
      availableQuantity: null,
      currencyIds: [],
      serviceOptions: [],
      charges: [],
      issues: [],
      destination: input.destination,
      version: "",
      expiresAt: "",
    };
    const retailLinks = catalog.links.filter(
      (link) => link.sourceOfferId === main.id,
    );
    const linkFor = (id: string) =>
      retailLinks.find(
        (link) =>
          link.targetOfferId === id &&
          (link.variant === "delivery" || link.variant === "add-on"),
      );
    const currenciesByOffer = new Map<string, string[]>();
    const supportedCurrencies = (offer: IModel) => {
      const cached = currenciesByOffer.get(offer.id);
      if (cached) {
        return cached;
      }
      const productAttrs = catalog.productAttributes.get(offer.productId) ?? [];
      const coefficients = catalog.storeAttributes.get(offer.storeId) ?? [];
      try {
        const formula = compileTariffFormula(
          textSetting(productAttrs, "price_formula"),
        );
        textSetting(productAttrs, "formula_version");
        const supported = catalog.currencies
          .filter((entry) => {
            try {
              const pricedCoefficient = coefficients.some(
                (row) =>
                  formula.variables.includes(row.key) &&
                  !isRuntimeInput(row.key) &&
                  !row.key.endsWith("_percent") &&
                  row.currencyIds.length === 1 &&
                  row.currencyIds[0] === entry.id,
              );
              if (!pricedCoefficient) {
                priceFor(attrs(offer.id), entry.id);
              }
              for (const name of formula.variables) {
                if (name === "unit_price") {
                  priceFor(attrs(offer.id), entry.id);
                } else if (!isRuntimeInput(name)) {
                  coefficient(coefficients, name, entry.id);
                }
              }
              return true;
            } catch {
              return false;
            }
          })
          .map((entry) => entry.id);
        currenciesByOffer.set(offer.id, supported);
        return supported;
      } catch {
        currenciesByOffer.set(offer.id, []);
        return [];
      }
    };
    const available = (offer: IModel) => {
      const stock = stockQuantity(attrs(offer.id));
      return stock === null ? null : Math.max(0, stock - (held[offer.id] ?? 0));
    };
    const options: IOfferServiceOption[] = [];
    for (const link of retailLinks) {
      const offer = catalog.offers.get(link.targetOfferId);
      const product = offer && catalog.products.get(offer.productId);
      if (
        !offer ||
        !product ||
        !this.retail(offer) ||
        product.kind !== "service" ||
        offer.storeId !== main.storeId ||
        (link.variant !== "delivery" && link.variant !== "add-on")
      ) {
        continue;
      }
      const currencyIds = supportedCurrencies(offer);
      try {
        if (
          offer.settings.regionIds?.length &&
          input.destination?.address?.trim()
        ) {
          const location = await this.deps
            .routing()
            .geocode(input.destination.address);
          if (
            !offer.settings.regionIds.some((region) =>
              location.regions.includes(region),
            )
          ) {
            continue;
          }
        }
        if (available(offer) === 0) {
          continue;
        }
      } catch {
        continue;
      }
      options.push({
        offerId: offer.id,
        productId: product.id,
        title: product.title?.en || product.adminTitle,
        role: link.variant,
        receiptMethod:
          offer.settings.receiptMethod ??
          (link.variant === "delivery" ? "shipping" : undefined),
        pickupPointIds: offer.settings.pickupPointIds,
        regionIds: offer.settings.regionIds,
        currencyIds,
      });
    }
    result.serviceOptions = options.filter((option) =>
      option.currencyIds.includes(input.currencyId),
    );
    result.currencyIds = supportedCurrencies(main)
      .filter((id) =>
        services.every((service) => {
          const offer = catalog.offers.get(service.offerId);
          return (
            offer &&
            linkFor(offer.id) &&
            supportedCurrencies(offer).includes(id)
          );
        }),
      )
      .sort();
    let charge: IOfferCharge | undefined;
    let expiryMinutes = main.settings.quoteMinutes ?? 15;
    let deliveryCount = 0;
    const selected = [
      { offerId: main.id, quantity: input.quantity, lineId: input.lineId },
      ...services,
    ];
    const seen = new Set<string>();
    for (const [index, choice] of selected.entries()) {
      const offer = catalog.offers.get(choice.offerId);
      try {
        if (
          !offer ||
          !Number.isSafeInteger(choice.quantity) ||
          choice.quantity < 1 ||
          (index && choice.quantity > input.quantity) ||
          seen.has(choice.offerId)
        ) {
          throw new Error("Invalid offer or service quantity");
        }
        seen.add(offer.id);
        const link = index ? linkFor(offer.id) : undefined;
        if (
          index &&
          (!link ||
            offer.storeId !== main.storeId ||
            !this.retail(offer) ||
            catalog.products.get(offer.productId)?.kind !== "service")
        ) {
          throw new Error("Service is not available for this offer");
        }
        const providerLink = catalog.providers.find(
          (item) => item.sourceOfferId === offer.id,
        );
        const provider =
          providerLink && catalog.offers.get(providerLink.targetOfferId);
        if (
          providerLink &&
          (!provider ||
            provider.variant !== "provider" ||
            provider.productId !== offer.productId)
        ) {
          throw new Error("Service provider is unavailable");
        }
        if (link?.variant === "delivery") {
          deliveryCount++;
          if (deliveryCount > 1 || choice.quantity !== 1) {
            throw new Error("Choose one delivery method");
          }
        }
        const max = available(offer);
        if (!index) {
          result.availableQuantity = max;
        }
        if (max !== null && choice.quantity > max) {
          result.issues.push({
            code: "insufficient_stock",
            offerId: offer.id,
            message: "Not enough stock",
            available: max,
          });
        }
        const productAttrs =
          catalog.productAttributes.get(offer.productId) ?? [];
        const formula = textSetting(productAttrs, "price_formula");
        const formulaVersion = textSetting(productAttrs, "formula_version");
        const compiled = compileTariffFormula(formula);
        if (!currency || !supportedCurrencies(offer).includes(currency.id)) {
          throw new Error("Offer cannot be priced in the selected currency");
        }
        const inputs: Record<string, string> = {};
        const settings = offer.settings;
        expiryMinutes = Math.min(expiryMinutes, settings.quoteMinutes ?? 15);
        const method = settings.receiptMethod ?? "shipping";
        const needsAddress =
          link?.variant === "delivery" && method === "shipping";
        if (needsAddress && !input.destination?.address?.trim()) {
          throw new Error("Delivery address is required");
        }
        if (
          link?.variant === "delivery" &&
          method === "pickup" &&
          (!input.destination?.pickupPointId ||
            !settings.pickupPointIds?.includes(input.destination.pickupPointId))
        ) {
          throw new Error("Select an available pickup point");
        }
        let geocoded;
        if (
          settings.regionIds?.length ||
          compiled.variables.includes("distance_km")
        ) {
          if (!input.destination?.address?.trim()) {
            throw new Error("Delivery address is required for this tariff");
          }
          geocoded = await this.deps
            .routing()
            .geocode(input.destination.address);
          if (
            settings.regionIds?.length &&
            !settings.regionIds.some((region) =>
              geocoded.regions.includes(region),
            )
          ) {
            throw new Error("Delivery is unavailable in this region");
          }
        }
        for (const name of compiled.variables) {
          if (name === "quantity") {
            inputs[name] = String(input.quantity);
          } else if (name === "serviced_qty") {
            inputs[name] = String(choice.quantity);
          } else if (name === "unit_price") {
            inputs[name] = priceFor(attrs(offer.id), currency.id);
          } else if (name === "serviced_subtotal") {
            if (!charge) {
              throw new Error("Missing main product charge");
            }
            const units = new Decimal(charge.amount).times(
              Decimal.pow(10, precision(currency)),
            );
            const perUnit = units.divToInt(input.quantity);
            const remainder = units.mod(input.quantity);
            inputs[name] = perUnit
              .times(choice.quantity)
              .plus(Decimal.min(remainder, choice.quantity))
              .div(Decimal.pow(10, precision(currency)))
              .toFixed();
          } else if (name === "distance_km") {
            const origin =
              settings.origin ??
              provider?.settings.origin ??
              main.settings.origin;
            if (!origin || !geocoded) {
              throw new Error("Missing delivery route origin or destination");
            }
            const metres = await this.deps
              .routing()
              .distance(origin, geocoded, settings.routeProfile ?? "drive");
            inputs[name] = new Decimal(metres).div(1000).toFixed();
          } else if (isRuntimeInput(name)) {
            inputs[name] = packageInput(main, name, input.quantity);
          } else {
            inputs[name] = coefficient(
              catalog.storeAttributes.get(offer.storeId) ?? [],
              name,
              currency.id,
            );
          }
        }
        const amount = compiled
          .evaluate(inputs)
          .toFixed(precision(currency), Decimal.ROUND_HALF_UP);
        const role = (link?.variant ?? "product") as IOfferCharge["role"];
        const priced = {
          offerId: offer.id,
          productId: offer.productId,
          storeId: offer.storeId,
          providerStoreId: provider?.storeId ?? offer.storeId,
          quantity: choice.quantity,
          lineId: choice.lineId,
          role,
          recurrence: link?.recurrence ?? "each",
          stockQuantity: stockQuantity(attrs(offer.id)),
          availableQuantity: max,
          amount,
          formula,
          formulaVersion,
          inputs,
        };
        result.charges.push(priced);
        if (!index) {
          charge = priced;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Offer cannot be calculated";
        let code = "unavailable";
        if (message.startsWith("Delivery address is required")) {
          code = "address_required";
        } else if (message === "Select an available pickup point") {
          code = "pickup_required";
        }
        result.issues.push({ code, offerId: choice.offerId, message });
      }
    }
    if (main.settings.requiredDelivery && !deliveryCount) {
      result.issues.push({
        code: "delivery_required",
        offerId: main.id,
        message: "Select a delivery method",
      });
    }
    if (currency && !result.issues.length) {
      result.amount = result.charges
        .reduce((total, item) => total.plus(item.amount), new Decimal(0))
        .toFixed(precision(currency));
    }
    result.version = createHash("sha256")
      .update(
        JSON.stringify([
          main.id,
          input.currencyId,
          input.quantity,
          input.destination?.address ?? "",
          input.destination?.region ?? "",
          input.destination?.pickupPointId ?? "",
          result.charges
            .map(
              ({ lineId, stockQuantity, availableQuantity, ...terms }) => terms,
            )
            .sort((a, b) => a.offerId.localeCompare(b.offerId)),
          result.issues,
          result.currencyIds,
        ]),
      )
      .digest("hex");
    result.expiresAt = new Date(
      now.getTime() + Math.min(1440, Math.max(1, expiryMinutes)) * 60000,
    ).toISOString();
    return result;
  }

  private retail(offer: IModel) {
    return offer.variant === "default";
  }
}
