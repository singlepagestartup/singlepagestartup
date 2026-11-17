import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import { compileTariffFormula } from "@sps/backend-utils";
import { offerSettingsSchema } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
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

function servicedSubtotal(
  amount: string,
  quantity: number,
  servicedQuantity: number,
  digits: number,
) {
  const scale = Decimal.pow(10, digits);
  const units = new Decimal(amount).times(scale);
  return units
    .divToInt(quantity)
    .times(servicedQuantity)
    .plus(Decimal.min(units.mod(quantity), servicedQuantity))
    .div(scale)
    .toFixed();
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
interface IPricePreviewProps {
  offer: IModel;
  main: IModel;
  formula: ReturnType<typeof compileTariffFormula>;
  currency: IOfferCatalog["currencies"][number];
  quantity: number;
  role: IOfferServiceOption["role"];
  productCharge?: IOfferCharge;
  available: number | null;
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
    const formulas = new Map<string, ReturnType<typeof compileTariffFormula>>();
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
        formulas.set(offer.id, formula);
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
      const receiptMethod =
        offer.settings.receiptMethod ??
        (link.variant === "delivery" ? "shipping" : undefined);
      options.push({
        offerId: offer.id,
        productId: product.id,
        title: product.title?.en || product.adminTitle,
        titles: product.title ?? undefined,
        role: link.variant,
        receiptMethod,
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
            inputs[name] = servicedSubtotal(
              charge.amount,
              input.quantity,
              choice.quantity,
              precision(currency),
            );
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
        const priced: IOfferCharge = {
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
        if (!index) {
          priced.unitAmount = this.unitAmount(
            compiled,
            inputs,
            main,
            precision(currency),
          );
        }
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
    if (currency) {
      for (const option of result.serviceOptions) {
        const offer = catalog.offers.get(option.offerId);
        const formula = formulas.get(option.offerId);
        if (!offer || !formula) {
          continue;
        }
        option.pricePreview = this.pricePreview({
          offer,
          main,
          formula,
          currency,
          quantity: input.quantity,
          role: option.role,
          productCharge: charge,
          available: available(offer),
        });
        if (option.role === "delivery" && option.receiptMethod === "shipping") {
          option.deliveryTariff = this.deliveryTariff(
            formula,
            option.pricePreview,
          );
        }
      }
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
              ({
                lineId,
                stockQuantity,
                availableQuantity,
                unitAmount,
                ...terms
              }) => terms,
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

  private unitAmount(
    formula: ReturnType<typeof compileTariffFormula>,
    quotedInputs: Record<string, string>,
    main: IModel,
    digits: number,
  ): string | null {
    const inputs = { ...quotedInputs };
    try {
      for (const name of formula.variables) {
        if (name === "quantity" || name === "serviced_qty") {
          inputs[name] = "1";
        } else if (
          isRuntimeInput(name) &&
          name !== "unit_price" &&
          name !== "distance_km" &&
          name !== "serviced_subtotal"
        ) {
          inputs[name] = packageInput(main, name, 1);
        }
      }
      return formula.evaluate(inputs).toFixed(digits, Decimal.ROUND_HALF_UP);
    } catch {
      return null;
    }
  }

  private pricePreview(
    props: IPricePreviewProps,
  ): IOfferServiceOption["pricePreview"] {
    const { catalog, precision } = this.deps;
    if (!Number.isSafeInteger(props.quantity) || props.quantity < 1) {
      return undefined;
    }
    const maximum =
      props.role === "delivery"
        ? 1
        : Math.min(props.quantity, props.available ?? props.quantity);
    if (maximum < 1) {
      return undefined;
    }
    const inputs: Record<string, { min: string; max?: string }> = {};
    const exact = (value: string) => ({ min: value, max: value });
    let dynamic = false;
    try {
      const providerLink = catalog.providers.find(
        (link) => link.sourceOfferId === props.offer.id,
      );
      const provider =
        providerLink && catalog.offers.get(providerLink.targetOfferId);
      if (
        providerLink &&
        (!provider ||
          provider.variant !== "provider" ||
          provider.productId !== props.offer.productId)
      ) {
        return undefined;
      }
      for (const name of props.formula.variables) {
        if (name === "quantity") {
          dynamic = true;
          inputs[name] = exact(String(props.quantity));
        } else if (name === "serviced_qty") {
          dynamic ||= props.role !== "delivery";
          inputs[name] = { min: "1", max: String(maximum) };
        } else if (name === "serviced_subtotal") {
          if (!props.productCharge) {
            return undefined;
          }
          dynamic = true;
          inputs[name] = {
            min: servicedSubtotal(
              props.productCharge.amount,
              props.quantity,
              1,
              precision(props.currency),
            ),
            max: servicedSubtotal(
              props.productCharge.amount,
              props.quantity,
              maximum,
              precision(props.currency),
            ),
          };
        } else if (name === "distance_km") {
          const origin =
            props.offer.settings.origin ??
            provider?.settings.origin ??
            props.main.settings.origin;
          if (
            !origin ||
            !offerSettingsSchema.shape.origin.safeParse(origin).success ||
            !offerSettingsSchema.shape.routeProfile.safeParse(
              props.offer.settings.routeProfile,
            ).success
          ) {
            return undefined;
          }
          dynamic = true;
          inputs[name] = { min: "0" };
        } else if (name === "unit_price") {
          inputs[name] = exact(
            priceFor(
              catalog.offerAttributes.get(props.offer.id) ?? [],
              props.currency.id,
            ),
          );
        } else if (isRuntimeInput(name)) {
          dynamic = true;
          inputs[name] = exact(packageInput(props.main, name, props.quantity));
        } else {
          inputs[name] = exact(
            coefficient(
              catalog.storeAttributes.get(props.offer.storeId) ?? [],
              name,
              props.currency.id,
            ),
          );
        }
      }
      const range = props.formula.evaluateRange(inputs);
      if (!range) {
        return undefined;
      }
      const fixed = !dynamic && range.max?.eq(range.min);
      return {
        kind: fixed ? "fixed" : "from",
        amount: range.min.toFixed(
          precision(props.currency),
          Decimal.ROUND_HALF_UP,
        ),
      };
    } catch {
      return undefined;
    }
  }

  private deliveryTariff(
    formula: ReturnType<typeof compileTariffFormula>,
    preview: IOfferServiceOption["pricePreview"],
  ): IOfferServiceOption["deliveryTariff"] {
    if (formula.variables.includes("distance_km")) {
      return { basis: "distance" };
    }
    if (
      formula.variables.some(
        (name) =>
          isRuntimeInput(name) &&
          name !== "serviced_qty" &&
          name !== "unit_price",
      )
    ) {
      return { basis: "calculated" };
    }
    if (preview?.kind === "fixed") {
      return { basis: "fixed", fixedAmount: preview.amount };
    }
    return undefined;
  }

  private retail(offer: IModel) {
    return offer.variant === "default";
  }
}
