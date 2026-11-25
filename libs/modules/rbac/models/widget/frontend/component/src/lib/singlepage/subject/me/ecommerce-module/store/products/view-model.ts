import type {
  IStoreProduct,
  IStoreProductOffer,
  IStoreProductPrice,
} from "@sps/rbac/models/subject/sdk/model";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";

export function localizedText(
  values: Record<string, string | undefined> | null,
  language: string,
) {
  const text = values?.[language];
  return text === undefined
    ? Object.values(values ?? {}).find((value) => value?.trim())
    : text.trim();
}

export function productName(
  product: IStoreProduct["product"],
  language: string,
) {
  return localizedText(product.title, language) || product.adminTitle;
}

export function productKind(
  kind: IStoreProduct["product"]["kind"],
  ru: boolean,
) {
  const labels = {
    service: ru ? "Услуга" : "Service",
    physical: ru ? "Физический товар" : "Physical product",
    digital: ru ? "Цифровой товар" : "Digital product",
  };
  return labels[kind as keyof typeof labels] ?? kind;
}

export function offerVariantLabel(
  variant: IStoreProductOffer["variant"],
  ru: boolean,
) {
  const labels = {
    default: ru ? "Обычное" : "Standard",
    hidden: ru ? "Скрытое" : "Hidden",
    provider: ru ? "Предложение исполнителя" : "Provider offer",
  };
  return labels[variant as keyof typeof labels] ?? variant;
}

export function priceIdentifier(price: IStoreProductPrice) {
  return `${price.attributeId}:${price.currencyId}`;
}

export function priceLabel(price: IStoreProductPrice, language: string) {
  return `${formatCurrencyAmount(price.amount, language)} ${price.currencySymbol || price.currencyTitle}`;
}

export function productPriceLabels(item: IStoreProduct, language: string) {
  const prices = item.offers.length
    ? item.offers.flatMap((offer) =>
        offer.prices.length ? offer.prices : item.productPrices,
      )
    : item.productPrices;
  const currencyBySymbol = new Map<string, string | null>();
  for (const { currencyId, currencySymbol } of prices) {
    const id = currencyBySymbol.get(currencySymbol);
    currencyBySymbol.set(
      currencySymbol,
      id === undefined || id === currencyId ? currencyId : null,
    );
  }
  return [
    ...new Set(
      prices.map((price) => {
        if (
          price.currencySymbol &&
          currencyBySymbol.get(price.currencySymbol) === null
        ) {
          return `${formatCurrencyAmount(price.amount, language)} ${price.currencyTitle}`;
        }
        return priceLabel(price, language);
      }),
    ),
  ];
}
