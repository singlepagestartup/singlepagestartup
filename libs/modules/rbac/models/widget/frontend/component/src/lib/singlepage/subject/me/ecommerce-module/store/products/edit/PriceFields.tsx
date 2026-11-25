import type {
  IStoreProductPrice,
  IStoreProductRelations,
} from "@sps/rbac/models/subject/sdk/model";
import { settingsFormStyles, Button, Input } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { Trash2 } from "lucide-react";
import { priceIdentifier, priceLabel } from "../view-model";

type TCurrencies = IStoreProductRelations["currencyOptions"];

interface IProps {
  language: string;
  heading: string;
  ownerId: string;
  prices: IStoreProductPrice[];
  values: Record<string, string>;
  newValues?: Record<string, string>;
  currencies?: TCurrencies;
  onChange: (key: string, value: string) => void;
  onNewPriceChange: (
    ownerId: string,
    currencyId: string,
    value: string | undefined,
  ) => void;
  onRemove?: (price: IStoreProductPrice) => void;
}

const pricePattern = "(0|[1-9][0-9]*)([.,][0-9]{1,8})?";

export function priceFieldKey(ownerId: string, price: IStoreProductPrice) {
  return `${ownerId}:${priceIdentifier(price)}`;
}

export function priceChanges(
  ownerId: string,
  prices: IStoreProductPrice[],
  values: Record<string, string>,
) {
  return prices.flatMap((price) => {
    const value = values[priceFieldKey(ownerId, price)]
      ?.trim()
      .replace(",", ".");
    return price.editable && value !== undefined && value !== price.amount
      ? [
          {
            attributeId: price.attributeId,
            currencyId: price.currencyId,
            expectedAmount: price.amount,
            amount: value,
          },
        ]
      : [];
  });
}

export function newPriceChanges(
  values: Record<string, string> | undefined,
  prices: IStoreProductPrice[],
) {
  return Object.entries(values ?? {}).flatMap(([currencyId, value]) =>
    prices.some((price) => price.currencyId === currencyId)
      ? []
      : [{ currencyId, amount: value.trim().replace(",", ".") }],
  );
}

export function PriceFields({
  language,
  heading,
  ownerId,
  prices,
  values,
  newValues,
  currencies,
  onChange,
  onNewPriceChange,
  onRemove,
}: IProps) {
  const ru = language === "ru";
  const added = newPriceChanges(newValues, prices);
  const available = currencies?.filter(
    ({ id }) =>
      !prices.some(({ currencyId }) => currencyId === id) &&
      newValues?.[id] === undefined,
  );
  const priceName = ru ? "Цена" : "Price";

  return (
    <div className="grid min-w-0 gap-3">
      {!prices.length && !added.length && (
        <p className="text-sm text-muted-foreground">
          {ru ? "Цены не заданы." : "No prices set."}
        </p>
      )}
      {!!prices.length && (
        <div className="grid gap-3 sm:grid-cols-2">
          {prices.map((price) => {
            const key = priceFieldKey(ownerId, price);
            return (
              <div key={key} className="flex min-w-0 items-end gap-2">
                <label className={`${settingsFormStyles.label} flex-1`}>
                  <span>
                    {priceName} · {price.currencyTitle} {price.currencySymbol}
                  </span>
                  {price.editable ? (
                    <Input
                      className={settingsFormStyles.field}
                      required
                      inputMode="decimal"
                      pattern={pricePattern}
                      maxLength={100}
                      value={values[key] ?? price.amount}
                      onChange={(event) =>
                        onChange(key, event.currentTarget.value)
                      }
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {priceLabel(price, language)}
                    </span>
                  )}
                </label>
                {onRemove && price.editable && prices.length > 1 && (
                  <Button
                    className={`${settingsFormStyles.secondary} size-11 shrink-0 px-0`}
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`${ru ? "Удалить цену" : "Remove price"} · ${price.currencyTitle}`}
                    onClick={() => onRemove(price)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {added.map(({ currencyId }) => {
        const currency = currencies?.find(({ id }) => id === currencyId);
        const title = currency?.title ?? currencyId;
        return (
          <div key={currencyId} className="flex flex-wrap items-end gap-2">
            <label className={`${settingsFormStyles.label} flex-1 basis-32`}>
              <span>
                {priceName} · {title} {currency?.symbol}
              </span>
              <Input
                className={settingsFormStyles.field}
                required
                inputMode="decimal"
                pattern={pricePattern}
                maxLength={100}
                value={newValues?.[currencyId] ?? ""}
                onChange={(event) =>
                  onNewPriceChange(
                    ownerId,
                    currencyId,
                    event.currentTarget.value,
                  )
                }
              />
            </label>
            <Button
              className={`${settingsFormStyles.secondary} w-fit`}
              type="button"
              variant="outline"
              onClick={() => onNewPriceChange(ownerId, currencyId, undefined)}
            >
              {ru ? "Удалить цену" : "Remove price"}
            </Button>
          </div>
        );
      })}
      {!!available?.length && (
        <Select
          className={settingsFormStyles.field}
          ui="shadcn"
          aria-label={`${heading}: ${ru ? "добавить цену" : "add price"}`}
          value=""
          placeholder={
            ru
              ? "Добавить цену в другой валюте"
              : "Add a price in another currency"
          }
          onValueChange={(currencyId) => {
            if (currencyId) onNewPriceChange(ownerId, currencyId, "");
          }}
          options={available.map(({ id, title }) => ({
            value: id,
            label: title,
          }))}
        />
      )}
    </div>
  );
}
