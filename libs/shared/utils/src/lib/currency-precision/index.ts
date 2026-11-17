export interface ICurrencyPrecisionInput {
  slug: string;
  minorUnitDigits?: number | null;
}

export function currencyPrecision(
  currency: string | ICurrencyPrecisionInput,
): number {
  const slug = typeof currency === "string" ? currency : currency.slug;
  if (slug.toLowerCase() === "telegram-star") {
    return 0;
  }
  const configured =
    typeof currency === "string" ? undefined : currency.minorUnitDigits;
  if (configured !== undefined && configured !== null) {
    if (!Number.isInteger(configured) || configured < 0 || configured > 8) {
      throw new Error(
        "Validation error. Currency precision must be an integer from zero to eight",
      );
    }
    return configured;
  }
  return 2;
}
