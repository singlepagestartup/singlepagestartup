import type { ICatalogContext } from "@sps/rbac/models/subject/sdk/model";

type OfferSettings = ICatalogContext["offers"][number]["settings"];
export type TPaymentTiming =
  "in-cart" | "after-acceptance" | "work-formula" | "legacy-tokens";

export function offerPaymentTiming(settings: OfferSettings): TPaymentTiming {
  if (settings.workTokenPricing) {
    return settings.workTokenPricing.multiplier === undefined
      ? "work-formula"
      : "legacy-tokens";
  }
  return settings.requiresResultAcceptance ? "after-acceptance" : "in-cart";
}

export function offerPaymentSettings(
  timing: string,
  currencyId: string | undefined,
  previous: OfferSettings = {},
): OfferSettings {
  if (timing === "legacy-tokens") return previous;
  if (timing === "work-formula" && !currencyId)
    throw new Error("Token currency is unavailable.");
  const { workTokenPricing: _previousPricing, ...settings } = previous;
  return {
    ...settings,
    requiresResultAcceptance: timing === "after-acceptance",
    ...(timing !== "in-cart" && { standalone: true }),
    ...(timing === "work-formula" &&
      currencyId && { workTokenPricing: { currencyId } }),
  };
}

interface IPaymentTimingProps {
  settings?: OfferSettings;
  currencyId?: string;
  language?: string;
  onChange?: (timing: TPaymentTiming) => void;
}

export function PaymentTiming({
  settings = {},
  currencyId,
  language,
  onChange,
}: IPaymentTimingProps) {
  const ru = language === "ru";
  const timing = offerPaymentTiming(settings);
  return (
    <label className="grid gap-2 text-sm font-medium">
      {ru ? "Когда платит покупатель" : "When the customer pays"}
      <select
        name="paymentTiming"
        className="min-h-11 rounded-xl border border-input bg-background px-3 py-2"
        defaultValue={timing}
        onChange={(event) => onChange?.(event.target.value as TPaymentTiming)}
      >
        <option value="in-cart">
          {ru ? "При оформлении заказа" : "At checkout"}
        </option>
        <option value="after-acceptance">
          {ru ? "После приёмки результата" : "After accepting the result"}
        </option>
        <option value="work-formula" disabled={!currencyId}>
          {ru
            ? "По мере работы агента · формула товара"
            : "As the agent works · product formula"}
        </option>
        {timing === "legacy-tokens" && (
          <option value="legacy-tokens">
            {ru ? "Токены по прежнему тарифу" : "Existing token tariff"}
          </option>
        )}
      </select>
    </label>
  );
}
