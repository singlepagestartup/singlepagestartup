import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import { compileTariffFormula } from "@sps/backend-utils";
import { offerSettingsSchema } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import type { IOfferAttribute, IOfferCatalog } from "../catalog";
import type {
  IModel,
  IOfferCharge,
  IOfferQuoteInput,
  IOfferQuote,
  IOfferServiceOption,
  IOfferServiceSelection,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { IDeliveryRouting } from "./routing";

interface IDependencies {
  catalog: IOfferCatalog;
  held: Record<string, number>;
  routing: () => IDeliveryRouting;
  precision: (currency: IOfferCatalog["currencies"][number]) => number;
  now: Date;
  fulfillmentAlreadySatisfied?: boolean;
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
  private readonly measurementNames = [
    "length_cm",
    "width_cm",
    "height_cm",
    "weight_kg",
  ] as const;
  private readonly runtimeInputs = new Set([
    "quantity",
    "serviced_qty",
    "serviced_subtotal",
    "distance_km",
    "unit_price",
    "total_weight_kg",
    "total_volume_cm3",
    ...this.measurementNames,
  ]);

  constructor(private readonly deps: IDependencies) {}

  async execute(request: IOfferQuoteInput): Promise<IOfferQuote> {
    const input: IOfferQuoteInput = {
      ...request,
      destination: request.destination && {
        address: request.destination.address,
        region: request.destination.region,
        coordinates: request.destination.coordinates,
      },
    };
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
    const services = [...(input.services ?? [])];
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
      fulfillmentAlreadySatisfied: Boolean(
        this.deps.fulfillmentAlreadySatisfied,
      ),
      charges: [],
      issues: [],
      destination: input.destination,
      version: "",
      expiresAt: "",
    };
    const retailLinks = catalog.links.filter((link) => {
      const source = catalog.offers.get(link.sourceOfferId);
      return source?.productId === main.productId;
    });
    const configurations = new Map<string, IOfferCatalog["links"][number]>();
    const ambiguous = new Set<string>();
    for (const link of retailLinks) {
      const previous = configurations.get(link.targetOfferId);
      if (
        previous &&
        (previous.variant !== link.variant ||
          (previous.recurrence ?? "each") !== (link.recurrence ?? "each"))
      ) {
        ambiguous.add(link.targetOfferId);
      }
      configurations.set(link.targetOfferId, link);
    }
    const linkFor = (id: string) =>
      retailLinks.find(
        (link) =>
          link.targetOfferId === id &&
          (link.variant === "delivery" || link.variant === "add-on"),
      );
    const explicitDelivery = services.find(
      (selection) => linkFor(selection.offerId)?.variant === "delivery",
    );
    const configuredDeliveryLinks = retailLinks.filter(
      (link) => link.variant === "delivery",
    );
    const pickupSelected = explicitDelivery
      ? catalog.offers.get(explicitDelivery.offerId)?.settings.receiptMethod ===
        "pickup"
      : configuredDeliveryLinks.length > 0 &&
        configuredDeliveryLinks.every(
          (link) =>
            catalog.offers.get(link.targetOfferId)?.settings.receiptMethod ===
            "pickup",
        );
    if (pickupSelected) {
      input.destination = {};
      result.destination = {};
    }
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
          this.textSetting(productAttrs, "price_formula"),
        );
        this.textSetting(productAttrs, "formula_version");
        formulas.set(offer.id, formula);
        const supported = catalog.currencies
          .filter((entry) => {
            try {
              const pricedCoefficient = coefficients.some(
                (row) =>
                  formula.variables.includes(row.key) &&
                  !this.isRuntimeInput(row.key) &&
                  !row.key.endsWith("_percent") &&
                  row.currencyIds.length === 1 &&
                  row.currencyIds[0] === entry.id,
              );
              if (!pricedCoefficient) {
                this.priceFor(attrs(offer.id), entry.id);
              }
              for (const name of formula.variables) {
                if (name === "unit_price") {
                  this.priceFor(attrs(offer.id), entry.id);
                } else if (!this.isRuntimeInput(name)) {
                  this.coefficient(coefficients, name, entry.id);
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
      const stock = this.stockQuantity(attrs(offer.id));
      return stock === null ? null : Math.max(0, stock - (held[offer.id] ?? 0));
    };
    const options: IOfferServiceOption[] = [];
    const eligibleOfferIds = new Set<string>();
    for (const link of retailLinks) {
      const offer = catalog.offers.get(link.targetOfferId);
      const product = offer && catalog.products.get(offer.productId);
      if (
        !offer ||
        !product ||
        !this.retail(offer) ||
        product.kind !== "service" ||
        ambiguous.has(offer.id) ||
        (link.variant !== "delivery" && link.variant !== "add-on")
      ) {
        continue;
      }
      const currencyIds = supportedCurrencies(offer);
      if (!currencyIds.length) {
        continue;
      }
      const providerLinks = catalog.providers.filter(
        (item) => item.sourceOfferId === offer.id,
      );
      const provider =
        providerLinks[0] && catalog.offers.get(providerLinks[0].targetOfferId);
      if (
        providerLinks.length > 1 ||
        (providerLinks.length === 1 &&
          (!provider ||
            provider.variant !== "provider" ||
            provider.productId !== offer.productId))
      ) {
        continue;
      }
      let eligible = true;
      try {
        if (
          offer.settings.receiptMethod !== "pickup" &&
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
            eligible = false;
          }
        }
        if (available(offer) === 0) {
          eligible = false;
        }
      } catch {
        eligible = false;
      }
      if (eligible) {
        eligibleOfferIds.add(offer.id);
      } else if (!services.some((service) => service.offerId === offer.id)) {
        continue;
      }
      const receiptMethod =
        offer.settings.receiptMethod ??
        (link.variant === "delivery" ? "shipping" : undefined);
      options.push({
        offerId: offer.id,
        productId: product.id,
        serviceKey: this.serviceKey(offer, link),
        compatibleOfferIds: [offer.id],
        title: product.title?.en || product.adminTitle,
        titles: product.title ?? undefined,
        role: link.variant,
        recurrence: link.recurrence ?? "each",
        receiptMethod,
        regionIds:
          receiptMethod === "pickup" ? undefined : offer.settings.regionIds,
        currencyIds,
      });
    }
    const grouped = new Map<string, IOfferServiceOption>();
    for (const option of [...options].sort((a, b) => {
      const eligibleFirst =
        Number(eligibleOfferIds.has(b.offerId)) -
        Number(eligibleOfferIds.has(a.offerId));
      return eligibleFirst || a.offerId.localeCompare(b.offerId);
    })) {
      if (!option.currencyIds.includes(input.currencyId)) {
        continue;
      }
      const prior = grouped.get(option.serviceKey!);
      if (prior) {
        if (!prior.compatibleOfferIds!.includes(option.offerId)) {
          prior.compatibleOfferIds!.push(option.offerId);
        }
      } else {
        grouped.set(option.serviceKey!, option);
      }
    }
    result.serviceOptions = [...grouped.values()];
    let charge: IOfferCharge | undefined;
    let expiryMinutes = main.settings.quoteMinutes ?? 15;
    let deliveryCount = 0;
    const calculate = async (
      choice: IOfferServiceSelection,
      isService: boolean,
    ): Promise<IOfferCharge> => {
      const offer = catalog.offers.get(choice.offerId);
      if (
        !offer ||
        !Number.isSafeInteger(choice.quantity) ||
        choice.quantity < 1 ||
        (isService && choice.quantity > input.quantity)
      ) {
        throw new Error("Invalid offer or service quantity");
      }
      const link = isService ? linkFor(offer.id) : undefined;
      if (
        isService &&
        (!link ||
          !this.retail(offer) ||
          catalog.products.get(offer.productId)?.kind !== "service")
      ) {
        throw new Error("Service is not available for this product");
      }
      if (isService && ambiguous.has(offer.id)) {
        throw new Error("Service configuration is ambiguous for this product");
      }
      if (link?.variant === "delivery" && choice.quantity !== 1) {
        throw new Error("Choose one delivery method");
      }
      const providerLinks = catalog.providers.filter(
        (item) => item.sourceOfferId === offer.id,
      );
      const provider =
        providerLinks[0] && catalog.offers.get(providerLinks[0].targetOfferId);
      if (
        providerLinks.length > 1 ||
        (providerLinks.length === 1 &&
          (!provider ||
            provider.variant !== "provider" ||
            provider.productId !== offer.productId))
      ) {
        throw new Error("Service provider is unavailable");
      }
      const max = available(offer);
      if (!isService) {
        result.availableQuantity = max;
      }
      const productAttrs = catalog.productAttributes.get(offer.productId) ?? [];
      const formula = this.textSetting(productAttrs, "price_formula");
      const formulaVersion = this.textSetting(productAttrs, "formula_version");
      const compiled = compileTariffFormula(formula);
      if (!currency || !supportedCurrencies(offer).includes(currency.id)) {
        throw new Error("Offer cannot be priced in the selected currency");
      }
      const inputs: Record<string, string> = {};
      const settings = offer.settings;
      const method = settings.receiptMethod ?? "shipping";
      const needsAddress =
        link?.variant === "delivery" && method === "shipping";
      if (needsAddress && !input.destination?.address?.trim()) {
        throw new Error("Delivery address is required");
      }
      const pickup =
        (link?.variant === "delivery" && method === "pickup") ||
        (!isService && pickupSelected);
      if (pickup && compiled.variables.includes("distance_km")) {
        throw new Error("Pickup tariff cannot use buyer delivery distance");
      }
      let geocoded;
      if (
        !pickup &&
        (settings.regionIds?.length ||
          compiled.variables.includes("distance_km"))
      ) {
        if (!input.destination?.address?.trim()) {
          throw new Error("Delivery address is required for this tariff");
        }
        geocoded = await this.deps.routing().geocode(input.destination.address);
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
          inputs[name] = this.priceFor(attrs(offer.id), currency.id);
        } else if (name === "serviced_subtotal") {
          if (!charge) {
            throw new Error("Missing main product charge");
          }
          inputs[name] = this.servicedSubtotal(
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
        } else if (this.isRuntimeInput(name)) {
          inputs[name] = this.packageInput(main, name, input.quantity);
        } else {
          inputs[name] = this.coefficient(
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
        stockQuantity: this.stockQuantity(attrs(offer.id)),
        availableQuantity: max,
        amount,
        formula,
        formulaVersion,
        inputs,
      };
      if (!isService) {
        priced.unitAmount = this.unitAmount(
          compiled,
          inputs,
          main,
          precision(currency),
        );
      }
      return priced;
    };
    const seen = new Set<string>();
    const append = async (
      choice: IOfferServiceSelection,
      isService: boolean,
    ) => {
      try {
        const offer = catalog.offers.get(choice.offerId);
        const link = isService && linkFor(choice.offerId);
        const key =
          offer && link ? this.serviceKey(offer, link) : choice.offerId;
        if (seen.has(key)) {
          throw new Error("Invalid offer or service quantity");
        }
        seen.add(key);
        if (link && link.variant === "delivery") {
          deliveryCount++;
          if (deliveryCount > 1) {
            throw new Error("Choose one delivery method");
          }
        }
        const max = offer ? available(offer) : null;
        if (!isService) {
          result.availableQuantity = max;
        }
        if (max !== null && choice.quantity > max) {
          result.issues.push({
            code: "insufficient_stock",
            offerId: choice.offerId,
            message: "Not enough stock",
            available: max,
          });
        }
        const priced = await calculate(choice, isService);
        if (!isService) {
          charge = priced;
        }
        expiryMinutes = Math.min(
          expiryMinutes,
          offer?.settings.quoteMinutes ?? 15,
        );
        result.charges.push(priced);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Offer cannot be calculated";
        let code = "unavailable";
        if (message.startsWith("Delivery address is required")) {
          code = "address_required";
        }
        result.issues.push({ code, offerId: choice.offerId, message });
      }
    };
    await append(
      { offerId: main.id, quantity: input.quantity, lineId: input.lineId },
      false,
    );
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
    const hasDelivery = services.some(
      (service) => linkFor(service.offerId)?.variant === "delivery",
    );
    if (!hasDelivery && !this.deps.fulfillmentAlreadySatisfied) {
      let cheapest: { offerId: string; amount?: Decimal } | undefined;
      for (const option of result.serviceOptions) {
        if (
          option.role !== "delivery" ||
          !eligibleOfferIds.has(option.offerId)
        ) {
          continue;
        }
        let amount: Decimal | undefined;
        try {
          const priced = await calculate(
            { offerId: option.offerId, quantity: 1 },
            true,
          );
          amount = new Decimal(priced.amount);
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (
            message.startsWith("Delivery address is required") &&
            option.pricePreview
          ) {
            amount = new Decimal(option.pricePreview.amount);
          }
        }
        if (
          !cheapest ||
          (amount && (!cheapest.amount || amount.lt(cheapest.amount)))
        ) {
          cheapest = { offerId: option.offerId, amount };
        }
      }
      if (cheapest) {
        services.push({ offerId: cheapest.offerId, quantity: 1 });
        if (
          !pickupSelected &&
          catalog.offers.get(cheapest.offerId)?.settings.receiptMethod ===
            "pickup"
        ) {
          return this.execute({ ...input, destination: {}, services });
        }
      }
    }
    result.selectedServices = services;
    for (const choice of services) {
      await append(choice, true);
    }
    const configuredDelivery =
      !this.deps.fulfillmentAlreadySatisfied &&
      retailLinks.some((link) => link.variant === "delivery");
    if (configuredDelivery && !deliveryCount) {
      result.issues.push({
        code: "delivery_required",
        offerId: main.id,
        message:
          "No fulfillment method is available for this product selection",
      });
    }
    result.currencyIds = supportedCurrencies(main)
      .filter(
        (id) =>
          (!configuredDelivery ||
            options.some(
              (option) =>
                option.role === "delivery" &&
                eligibleOfferIds.has(option.offerId) &&
                option.currencyIds.includes(id),
            )) &&
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
          "", // Preserve the retired pickup-point slot for accepted shipping quotes.
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
          services
            .map(({ lineId, ...selection }) => selection)
            .sort((a, b) => a.offerId.localeCompare(b.offerId)),
        ]),
      )
      .digest("hex");
    result.expiresAt = new Date(
      now.getTime() + Math.min(1440, Math.max(1, expiryMinutes)) * 60000,
    ).toISOString();
    return result;
  }

  private stockQuantity(attributes: IOfferAttribute[]): number | null {
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

  private textSetting(attributes: IOfferAttribute[], key: string): string {
    const rows = attributes.filter((attribute) => attribute.key === key);
    if (rows.length !== 1 || !rows[0].text?.trim()) {
      throw new Error("Missing or ambiguous " + key);
    }
    return rows[0].text.trim();
  }

  private numberSetting(rows: IOfferAttribute[], name: string): string {
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

  private priceFor(rows: IOfferAttribute[], currencyId: string) {
    return this.numberSetting(
      rows.filter(
        (row) =>
          row.type === "price" &&
          row.currencyIds.length === 1 &&
          row.currencyIds[0] === currencyId,
      ),
      "unit_price",
    );
  }

  private servicedSubtotal(
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

  private coefficient(
    rows: IOfferAttribute[],
    name: string,
    currencyId: string,
  ) {
    const candidates = rows.filter((row) => row.key === name);
    const scoped = candidates.filter(
      (row) =>
        row.currencyIds.length === 1 && row.currencyIds[0] === currencyId,
    );
    if (scoped.length || !name.endsWith("_percent")) {
      return this.numberSetting(scoped, name);
    }
    return this.numberSetting(
      candidates.filter((row) => !row.currencyIds.length),
      name,
    );
  }

  private packageInput(offer: IModel, name: string, quantity: number): string {
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
      const value = (
        key: "length_cm" | "width_cm" | "height_cm" | "weight_kg",
      ) => {
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
        const key = this.measurementNames.find((key) => key === name);
        if (!key || packages.length !== 1) {
          throw new Error(
            "Per-box dimension is ambiguous for multiple package types: " +
              name,
          );
        }
        return value(key).toFixed();
      }
    }
    return total.toFixed();
  }

  private isRuntimeInput(name: string) {
    return (
      this.runtimeInputs.has(name) ||
      /^package_[1-9][0-9]*_(length_cm|width_cm|height_cm|weight_kg|count)$/.test(
        name,
      )
    );
  }

  private serviceKey(offer: IModel, link: IOfferCatalog["links"][number]) {
    const { catalog } = this.deps;
    const provider = catalog.providers.find(
      (entry) => entry.sourceOfferId === offer.id,
    );
    const formula = (catalog.productAttributes.get(offer.productId) ?? []).find(
      (entry) => entry.key === "price_formula",
    )?.text;
    const variables = formula ? compileTariffFormula(formula).variables : [];
    const tariffAttributes = (rows: IOfferAttribute[]) =>
      rows
        .filter(
          (entry) => entry.type === "price" || variables.includes(entry.key),
        )
        .map((entry) => [
          entry.key,
          entry.type,
          entry.field,
          entry.number,
          entry.text,
          [...entry.currencyIds].sort(),
        ])
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return createHash("sha256")
      .update(
        JSON.stringify([
          offer.productId,
          provider?.targetOfferId ?? offer.storeId,
          offer.configurationKey ?? "",
          link.variant,
          link.recurrence ?? "each",
          offer.settings.receiptMethod ??
            (link.variant === "delivery" ? "shipping" : ""),
          offer.settings.receiptMethod === "pickup"
            ? []
            : [...(offer.settings.regionIds ?? [])].sort(),
          offer.settings.receiptMethod === "pickup"
            ? undefined
            : offer.settings.origin,
          offer.settings.receiptMethod === "pickup"
            ? undefined
            : offer.settings.routeProfile,
          tariffAttributes(catalog.offerAttributes.get(offer.id) ?? []),
          tariffAttributes(catalog.storeAttributes.get(offer.storeId) ?? []),
        ]),
      )
      .digest("hex");
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
          this.isRuntimeInput(name) &&
          name !== "unit_price" &&
          name !== "distance_km" &&
          name !== "serviced_subtotal"
        ) {
          inputs[name] = this.packageInput(main, name, 1);
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
    if (
      !Number.isSafeInteger(props.quantity) ||
      props.quantity < 1 ||
      (props.role === "delivery" &&
        props.offer.settings.receiptMethod === "pickup" &&
        props.formula.variables.includes("distance_km"))
    ) {
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
            min: this.servicedSubtotal(
              props.productCharge.amount,
              props.quantity,
              1,
              precision(props.currency),
            ),
            max: this.servicedSubtotal(
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
            this.priceFor(
              catalog.offerAttributes.get(props.offer.id) ?? [],
              props.currency.id,
            ),
          );
        } else if (this.isRuntimeInput(name)) {
          dynamic = true;
          inputs[name] = exact(
            this.packageInput(props.main, name, props.quantity),
          );
        } else {
          inputs[name] = exact(
            this.coefficient(
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
          this.isRuntimeInput(name) &&
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
    return offer.variant === "default" && offer.settings?.initialGrant !== true;
  }
}
