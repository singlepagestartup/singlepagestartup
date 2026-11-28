"use client";

import { useId, useState, type FormEvent } from "react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import type { IEditorProps } from "./interface";

interface IProps extends IEditorProps {
  productId: string;
  startWithFormula?: boolean;
}

export function ScopedAttributeForm(props: IProps) {
  const rateKeys = useId();
  const ru = props.language === "ru";
  const mutation = subjectApi.ecommerceModuleCatalogAttributeSet();
  const [feedback, setFeedback] = useState("");
  const ownsProduct = props.context.ownedProductIds.includes(props.productId);
  const formula = props.context.attributes.find(
    (item) =>
      item.owner.type === "product" &&
      item.owner.id === props.productId &&
      item.key === "price_formula",
  );
  const firstRate =
    props.context.attributes.find(
      (item) =>
        item.owner.type === "store" &&
        item.owner.id === props.storeId &&
        item.field === "number" &&
        formula?.text?.split(/[^a-z0-9_]+/).includes(item.key),
    )?.key ?? "dispatch_fee";
  const initialProduct = props.startWithFormula && ownsProduct;
  const [scope, setScope] = useState<"store" | "product">(
    initialProduct ? "product" : "store",
  );
  const [key, setKey] = useState(initialProduct ? "price_formula" : firstRate);
  const ownerId = scope === "store" ? props.storeId : props.productId;
  const attributes = props.context.attributes.filter(
    (attribute) =>
      attribute.owner.type === scope &&
      attribute.owner.id === ownerId &&
      (scope === "product" || attribute.field === "number"),
  );
  const current = attributes.find((attribute) => attribute.key === key);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setFeedback("");
    try {
      const value = String(values.get("value") ?? "");
      await mutation.mutateAsync({
        id: props.subjectId,
        data: {
          owner: { type: scope, id: ownerId },
          key,
          field: scope === "product" ? "string" : "number",
          string: scope === "product" ? value : undefined,
          number: scope === "store" ? value : undefined,
          currencyId:
            scope === "store" && values.get("currency")
              ? String(values.get("currency"))
              : undefined,
        },
      });
      await props.onRefresh();
      setFeedback(ru ? "Тариф сохранён." : "Catalogue attribute saved.");
    } catch (failure) {
      setFeedback(
        failure instanceof Error
          ? failure.message
          : ru
            ? "Не удалось сохранить тариф."
            : "Could not save this catalogue attribute.",
      );
    }
  }
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">
        {ru
          ? "Тарифы магазина и формула товара"
          : "Store rates and shared Product formula"}
      </h3>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className={settingsFormStyles.label}>
          {ru ? "Где хранится настройка" : "Owner"}
          <select
            className={settingsFormStyles.field}
            value={scope}
            onChange={(event) => {
              const next = event.target.value as "store" | "product";
              setScope(next);
              setKey(next === "product" ? "price_formula" : firstRate);
            }}
          >
            <option value="store">
              {ru ? "Ставки этого магазина" : "This store’s rates"}
            </option>
            <option value="product" disabled={!ownsProduct}>
              {ru
                ? "Формула товара · доступна владельцу"
                : "Shared Product · owner only"}
            </option>
          </select>
        </label>
        <label className={settingsFormStyles.label}>
          {ru ? "Параметр" : "Attribute key"}
          {scope === "product" ? (
            <select
              className={settingsFormStyles.field}
              value={key}
              onChange={(event) => setKey(event.target.value)}
            >
              <option value="price_formula">
                {ru ? "Формула расчёта цены" : "Price formula"}
              </option>
              <option value="formula_version">
                {ru ? "Версия формулы" : "Formula version"}
              </option>
            </select>
          ) : (
            <input
              className={settingsFormStyles.field}
              required
              list={rateKeys}
              pattern="[a-z][a-z0-9_\-]*"
              value={key}
              onChange={(event) => setKey(event.target.value)}
            />
          )}
        </label>
        <label className={settingsFormStyles.label}>
          {ru ? "Значение" : "Value"}
          <input
            key={`${scope}-${key}`}
            name="value"
            className={settingsFormStyles.field}
            required
            defaultValue={
              scope === "product" ? current?.text : (current?.number ?? "")
            }
          />
        </label>
        {scope === "store" && (
          <label className={settingsFormStyles.label}>
            {ru ? "Валюта" : "Currency"}
            <select
              key={key}
              name="currency"
              className={settingsFormStyles.field}
              required={!key.endsWith("_percent")}
              defaultValue={current?.currencyId ?? ""}
            >
              <option value="">
                {ru ? "Без валюты · проценты" : "No currency · percentage"}
              </option>
              {props.context.currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {scope === "store" && (
          <datalist id={rateKeys}>
            {Array.from(
              new Set(attributes.map((attribute) => attribute.key)),
            ).map((rateKey) => (
              <option key={rateKey} value={rateKey} />
            ))}
          </datalist>
        )}
        <button
          type="submit"
          className={settingsFormStyles.secondary}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? ru
              ? "Сохраняем…"
              : "Saving…"
            : ru
              ? "Сохранить тариф"
              : "Save rate or formula"}
        </button>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {scope === "store"
            ? ru
              ? "Укажите ключ ставки, используемый в формуле товара. Процентные ставки имеют окончание _percent и задаются без валюты."
              : "Use the rate key from the product formula. Percentage keys end in _percent and have no currency."
            : ru
              ? "unit_price — цена за штуку, quantity — количество. Для работы агента provider_usd — измеренная стоимость вызова в долларах, topup_tokens / topup_usd — курс пополнения кошелька. Ставка work_markup_percent / 100 берётся из магазина. Значение 200 удваивает стоимость работы."
              : "unit_price is the offer price per item and quantity is the item count. For agent work, provider_usd is the measured call cost in dollars and topup_tokens / topup_usd is the wallet exchange rate. Use work_markup_percent / 100 for the store rate. A value of 200 doubles the cost."}
        </p>
      </form>
      <dl className="space-y-1 text-xs text-muted-foreground">
        {attributes.map((attribute) => (
          <div
            key={`${attribute.id}-${attribute.key}`}
            className="flex flex-wrap justify-between gap-2"
          >
            <dt>{attribute.key}</dt>
            <dd className="break-all">
              {attribute.number ?? attribute.text}{" "}
              {
                props.context.currencies.find(
                  (currency) => currency.id === attribute.currencyId,
                )?.title
              }
            </dd>
          </div>
        ))}
      </dl>
      {feedback && (
        <p role="status" className="text-sm text-muted-foreground">
          {feedback}
        </p>
      )}
    </section>
  );
}
