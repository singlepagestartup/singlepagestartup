"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Component as Icon } from "../../../../shared/icon";
import {
  cartPurchaseScenarios,
  formatPurchaseMoney,
  wardrobePurchaseQuotes,
  type CartPurchaseLine,
  type CartPurchaseQuote,
} from "../../shared";
import type { IPurchaseDrawerProps } from "./interface";

const control =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton = `${button} border-primary bg-primary text-primary-foreground hover:bg-primary/90`;
const sellerNames = {
  a: "Магазин А · Мебель у дома",
  b: "Магазин Б · Дуб и дом",
};
const addressNames = {
  city: "Санкт-Петербург, Невский пр., 28",
  region: "Ленинградская область, Всеволожск, ул. Центральная, 12",
  missing: "Адрес не выбран",
};

function lineBlocked(line: CartPurchaseLine) {
  return Boolean(
    line.error ||
    (line.fulfillment === "delivery" && line.destination === "missing"),
  );
}

function Breakdown({
  quote,
  currency,
  deliveryLabel = "Доставка",
  assemblyLabel = "Сборка",
}: {
  quote: CartPurchaseQuote;
  currency: "RUB" | "USD";
  deliveryLabel?: string;
  assemblyLabel?: string;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-muted-foreground">Товар</dt>
        <dd>{formatPurchaseMoney(quote.product, currency)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted-foreground">{deliveryLabel}</dt>
        <dd>
          {quote.delivery === 0
            ? "Бесплатно"
            : formatPurchaseMoney(quote.delivery, currency)}
        </dd>
      </div>
      {quote.assembly > 0 ? (
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{assemblyLabel}</dt>
          <dd>{formatPurchaseMoney(quote.assembly, currency)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
        <dt>Итого за заказ</dt>
        <dd>{formatPurchaseMoney(quote.total, currency)}</dd>
      </div>
    </dl>
  );
}

interface IPurchaseLineProps {
  line: CartPurchaseLine;
  index: number;
  pending: boolean;
  onChange: (id: string, patch: Partial<CartPurchaseLine>) => void;
  onCompare: (id: string) => void;
  onRetry: (id: string) => void;
}

const PurchaseLine = memo(function PurchaseLine({
  line,
  index,
  pending,
  onChange,
  onCompare,
  onRetry,
}: IPurchaseLineProps) {
  const physical = !["tokens", "electronic"].includes(line.kind);
  const wardrobe = line.kind === "wardrobe";
  const quoteCurrency = line.error === "currency" ? "RUB" : line.currency;
  return (
    <section
      aria-labelledby={`${line.id}-title`}
      className="rounded-2xl border border-border bg-card p-4 sm:p-5"
      data-testid={line.id}
      aria-busy={pending}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <Icon variant="phosphor" name="package" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            Заказ {index + 1} · {line.id.toUpperCase()}
          </p>
          <h2
            id={`${line.id}-title`}
            className="mt-1 text-base font-semibold text-foreground"
          >
            {line.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {line.kind === "tokens" || line.kind === "electronic"
              ? "SPS Digital"
              : sellerNames[line.seller]}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Предложение{" "}
            {line.kind === "wardrobe" || line.kind === "distance"
              ? `WARDROBE-${line.seller.toUpperCase()}-OAK-120`
              : line.kind.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm text-foreground">
          <span>Количество</span>
          <select
            className={control}
            aria-label={`Количество, заказ ${index + 1}`}
            value={line.quantity}
            disabled={!wardrobe || pending}
            onChange={(event) =>
              onChange(line.id, {
                quantity: Number(event.target.value) as 1 | 2,
              })
            }
          >
            <option value={1}>1 шт.</option>
            <option value={2}>2 шт.</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm text-foreground">
          <span>Валюта заказа</span>
          <select
            className={control}
            aria-label={`Валюта, заказ ${index + 1}`}
            value={line.currency}
            disabled={!wardrobe || pending}
            onChange={(event) =>
              onChange(line.id, {
                currency: event.target.value as "RUB" | "USD",
              })
            }
          >
            <option value="RUB">RUB · российский рубль</option>
            <option value="USD">USD · доллар США</option>
          </select>
        </label>
      </div>

      {physical ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">
              {line.fulfillment === "pickup"
                ? "Самовывоз · бесплатно"
                : "Доставка продавцом"}
            </p>
            {line.fulfillment === "pickup" ? (
              <p className="mt-1 text-muted-foreground">
                Магазин А, Санкт-Петербург, Лиговский пр., 50 · 10:00–20:00
              </p>
            ) : null}
            {line.requiredDelivery ? (
              <p className="mt-1 text-muted-foreground">
                Доставка обязательна для этого предложения. Самовывоз
                недоступен.
              </p>
            ) : null}
          </div>
          {line.fulfillment === "delivery" ? (
            <label className="block space-y-1.5 text-sm text-foreground">
              <span>Адрес доставки</span>
              <select
                className={control}
                aria-label={`Адрес, заказ ${index + 1}`}
                value={line.destination}
                disabled={pending}
                onChange={(event) =>
                  onChange(line.id, {
                    destination: event.target
                      .value as CartPurchaseLine["destination"],
                  })
                }
              >
                <option value="missing">Выберите адрес</option>
                <option value="city">{addressNames.city}</option>
                <option value="region">{addressNames.region}</option>
              </select>
            </label>
          ) : null}
          {wardrobe ? (
            <label className="block space-y-1.5 text-sm text-foreground">
              <span>Сборка</span>
              <select
                className={control}
                aria-label={`Количество сборок, заказ ${index + 1}`}
                value={line.assemblyQuantity}
                disabled={pending}
                onChange={(event) =>
                  onChange(line.id, {
                    assemblyQuantity: Number(event.target.value) as 0 | 1 | 2,
                  })
                }
              >
                <option value={0}>Без сборки</option>
                <option value={1}>Собрать 1 шкаф</option>
                {line.quantity === 2 ? (
                  <option value={2}>Собрать 2 шкафа</option>
                ) : null}
              </select>
              <span className="block text-xs text-muted-foreground">
                Доставка оплачивается один раз за заказ. Сборка — за выбранное
                количество.
              </span>
            </label>
          ) : null}
          {line.kind === "distance" ? (
            <p className="text-sm leading-6 text-muted-foreground">
              Выезд 400 ₽ + 25 ₽/км × 24 км = 1 000 ₽. Сборка 10% × 5 000 ₽ =
              500 ₽. Маршрут 24 км задан в примере.
            </p>
          ) : null}
          {line.kind === "coffee" ? (
            <div className="space-y-2 text-sm">
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={line.recurringDelivery}
                  onChange={(event) =>
                    onChange(line.id, {
                      recurringDelivery: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-primary"
                />
                Доставка при каждой поставке
              </label>
              <p className="text-muted-foreground">
                Первая поставка: 2 400 ₽, включая упаковку 100 ₽. Следующие:{" "}
                {line.recurringDelivery
                  ? "2 300 ₽ с доставкой"
                  : "2 000 ₽, самовывоз"}
                . Каждые 4 недели, отдельный договор подписки.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
          {line.kind === "tokens"
            ? "Зачисление на баланс аккаунта после оплаты. Адрес не нужен."
            : "Электронная выдача: 2 USD. Ссылка появится в аккаунте после оплаты. Почтовый адрес не нужен."}
        </div>
      )}

      {line.error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {line.error === "stock" ? (
            <>
              Выбрано {line.quantity} шт., доступно {line.maxQuantity}.{" "}
              {line.maxQuantity === 0
                ? "Товар распродан. Выберите другой магазин."
                : "Уменьшите количество или выберите другой магазин."}
            </>
          ) : null}
          {line.error === "currency"
            ? "USD недоступен для шкафа с выбранными услугами. Выберите RUB. Предыдущий рублёвый расчёт сохранён."
            : null}
          {line.error === "quote"
            ? "Не удалось рассчитать доставку. Выбор сохранён. Повторите расчёт для этого заказа."
            : null}
        </div>
      ) : null}
      {line.destination === "missing" &&
      physical &&
      line.fulfillment === "delivery" ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Выберите адрес для расчёта доставки.
        </p>
      ) : null}

      <div
        className="mt-4 rounded-xl border border-border p-3 text-foreground"
        data-testid={`${line.id}-breakdown`}
      >
        {lineBlocked(line) ? (
          <p className="mb-2 text-xs text-muted-foreground">
            Предыдущий расчёт · требуется уточнение
          </p>
        ) : null}
        <Breakdown
          quote={line.quote}
          currency={quoteCurrency}
          deliveryLabel={
            line.fulfillment === "pickup"
              ? "Самовывоз"
              : line.kind === "electronic"
                ? "Электронная выдача"
                : line.kind === "tokens"
                  ? "Выдача"
                  : "Доставка"
          }
          assemblyLabel={
            line.kind === "coffee"
              ? "Упаковка · только первая поставка"
              : `Сборка · ${line.assemblyQuantity} шт.`
          }
        />
      </div>
      {wardrobe ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={button}
            disabled={
              pending ||
              line.error === "currency" ||
              line.destination === "missing"
            }
            onClick={() => onCompare(line.id)}
          >
            <Icon variant="phosphor" name="shopping-cart" className="h-4 w-4" />
            Сравнить магазины
          </button>
          {line.error === "quote" ? (
            <button
              type="button"
              className={button}
              disabled={pending}
              onClick={() => onRetry(line.id)}
            >
              {pending ? "Рассчитываем…" : "Повторить расчёт"}
            </button>
          ) : null}
        </div>
      ) : null}
      {pending ? (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Обновляем расчёт этого заказа…
        </p>
      ) : null}
    </section>
  );
});

export function ClientComponent({
  scenario,
  isOpen,
  onClose,
}: IPurchaseDrawerProps) {
  const fixture = cartPurchaseScenarios[scenario];
  const [lines, setLines] = useState(() =>
    fixture.lines.map((line) => ({ ...line, quote: { ...line.quote } })),
  );
  const [open, setOpen] = useState(isOpen);
  const [comparingId, setComparingId] = useState<string | null>(null);
  const [requoted, setRequoted] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkout = useRef<HTMLElement>(null);
  useEffect(() => setOpen(isOpen), [isOpen]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (checkoutOpen) {
      checkout.current?.scrollIntoView({ block: "nearest" });
      checkout.current?.focus();
    }
  }, [checkoutOpen]);

  const changeLine = useCallback(
    (id: string, patch: Partial<CartPurchaseLine>) => {
      setCheckoutOpen(false);
      setNotice("");
      setLines((current) =>
        current.map((line) => {
          if (line.id !== id) return line;
          const next = { ...line, ...patch };
          if (next.assemblyQuantity > next.quantity)
            next.assemblyQuantity = next.quantity;
          if (next.kind === "wardrobe") {
            const key = `${next.seller}/${next.quantity}/${next.destination === "missing" ? "city" : next.destination}/${next.assemblyQuantity}`;
            next.quote = wardrobePurchaseQuotes[key] ?? line.quote;
            next.error =
              next.currency !== "RUB"
                ? "currency"
                : next.maxQuantity !== undefined &&
                    next.quantity > next.maxQuantity
                  ? "stock"
                  : line.error === "quote"
                    ? "quote"
                    : undefined;
          }
          return next;
        }),
      );
    },
    [],
  );
  const openComparison = useCallback((id: string) => {
    setComparingId(id);
    setRequoted(false);
  }, []);
  const retryLine = useCallback((id: string) => {
    setPendingId(id);
    timer.current = setTimeout(() => {
      setLines((current) =>
        current.map((line) =>
          line.id === id ? { ...line, error: undefined } : line,
        ),
      );
      setPendingId(null);
      setNotice("Расчёт заказа обновлён. Остальные заказы сохранены.");
    }, 600);
  }, []);

  const comparing = lines.find((line) => line.id === comparingId);
  const targetSeller = comparing?.seller === "a" ? "b" : "a";
  const nextAssembly = comparing?.assemblyQuantity ?? 0;
  const previewKey = comparing
    ? `${targetSeller}/${comparing.quantity}/${comparing.destination}/${nextAssembly}`
    : "";
  const basePreview = wardrobePurchaseQuotes[previewKey];
  const preview =
    requoted &&
    targetSeller === "b" &&
    comparing?.quantity === 1 &&
    comparing.destination === "city" &&
    nextAssembly === 1
      ? { product: 5400, delivery: 700, assembly: 1500, total: 7600 }
      : basePreview;
  const currencies = Array.from(
    new Set(
      lines.map((line) =>
        line.error === "currency" ? ("RUB" as const) : line.currency,
      ),
    ),
  );
  const blocked = lines.some(lineBlocked) || pendingId !== null;

  function applyComparison() {
    if (!comparing || !preview) {
      return;
    }
    if (scenario === "tariff-changed" && !requoted && targetSeller === "b") {
      setRequoted(true);
      return;
    }
    setLines((current) =>
      current.map((line) =>
        line.id === comparing.id
          ? {
              ...line,
              seller: targetSeller,
              assemblyQuantity: nextAssembly,
              maxQuantity: undefined,
              error: undefined,
              quote: preview,
            }
          : line,
      ),
    );
    setCheckoutOpen(false);
    setNotice(
      `Магазин изменён для выбранного заказа. Новый итог: ${formatPurchaseMoney(preview.total, "RUB")}.`,
    );
    setComparingId(null);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) onClose?.();
      }}
    >
      <div
        data-ds-block="ecommerce.cart.drawer-default"
        data-ds-layer="singlepage"
        data-module="ecommerce"
        data-model="cart"
        data-variant="drawer-default"
        data-purchase-scenario={scenario}
      >
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-default/55" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[110] flex h-full w-full max-w-2xl flex-col bg-background font-default text-foreground shadow-2xl sm:rounded-l-3xl">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-2xl font-semibold">
                Корзина
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Магазины, получение и услуги по каждому заказу.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className={`${button} h-11 w-11 shrink-0 px-0`}
              aria-label="Закрыть корзину"
            >
              <Icon variant="phosphor" name="x" className="h-5 w-5" />
            </Dialog.Close>
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              {fixture.description}
            </p>
            {notice ? (
              <p
                role="status"
                className="rounded-xl border border-border bg-muted p-3 text-sm"
              >
                {notice}
              </p>
            ) : null}
            {lines.map((line, index) => (
              <PurchaseLine
                key={line.id}
                line={line}
                index={index}
                pending={pendingId === line.id}
                onChange={changeLine}
                onCompare={openComparison}
                onRetry={retryLine}
              />
            ))}
            {checkoutOpen ? (
              <section
                ref={checkout}
                tabIndex={-1}
                aria-label="Предварительные счета"
                className="rounded-2xl border border-primary/30 bg-primary/5 p-4 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <h2 className="font-semibold">Проверьте счета перед оплатой</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Заказы одной валюты оплачиваются вместе. Подписка оформляется
                  отдельным договором.
                </p>
                {currencies.map((currency) => (
                  <div
                    key={currency}
                    className="mt-3 rounded-xl border border-border bg-card p-3 text-sm"
                  >
                    <p className="font-semibold">
                      {lines.some((line) => line.kind === "coffee")
                        ? "Первая поставка"
                        : `Счёт в ${currency}`}{" "}
                      ·{" "}
                      {formatPurchaseMoney(
                        lines
                          .filter((line) => line.currency === currency)
                          .reduce((sum, line) => sum + line.quote.total, 0),
                        currency,
                      )}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {lines
                        .filter((line) => line.currency === currency)
                        .map(
                          (line) =>
                            `${line.title}: ${formatPurchaseMoney(line.quote.total, currency)}`,
                        )
                        .join("; ")}
                    </p>
                  </div>
                ))}
                <button
                  type="button"
                  className={`${button} mt-4`}
                  onClick={() => setCheckoutOpen(false)}
                >
                  Вернуться к выбору
                </button>
              </section>
            ) : null}
          </div>
          <footer className="max-h-[40dvh] shrink-0 space-y-3 overflow-y-auto border-t border-border bg-card p-4 sm:px-6">
            <div className="space-y-2" aria-label="Итоги по валютам">
              {currencies.map((currency) => {
                const group = lines.filter(
                  (line) =>
                    (line.error === "currency" ? "RUB" : line.currency) ===
                    currency,
                );
                return (
                  <div
                    key={currency}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {group.some(lineBlocked) ? "Предыдущий итог" : "Итого"} ·{" "}
                      {currency}
                    </span>
                    <strong
                      className="text-2xl"
                      data-testid={`total-${currency}`}
                    >
                      {formatPurchaseMoney(
                        group.reduce((sum, line) => sum + line.quote.total, 0),
                        currency,
                      )}
                    </strong>
                  </div>
                );
              })}
            </div>
            {currencies.length > 1 ? (
              <p className="text-xs text-muted-foreground">
                Отдельный счёт для каждой валюты. Конвертации нет.
              </p>
            ) : null}
            {blocked ? (
              <p className="text-sm text-destructive">
                Для оформления исправьте отмеченные заказы.
              </p>
            ) : null}
            <button
              type="button"
              className={`${primaryButton} w-full`}
              disabled={blocked}
              onClick={() => setCheckoutOpen(true)}
            >
              К оформлению
            </button>
          </footer>

          <Dialog.Root
            open={Boolean(comparing)}
            onOpenChange={(value) => {
              if (!value) setComparingId(null);
            }}
          >
            <Dialog.Overlay className="fixed inset-0 z-[120] bg-default/65" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-[130] max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-4 font-default text-foreground shadow-2xl sm:p-6">
              <Dialog.Title className="text-xl font-semibold">
                Сравнение магазинов
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                Одинаковая комплектация, {comparing?.quantity} шт., RUB.{" "}
                {comparing ? addressNames[comparing.destination] : ""}.
                Изменится только выбранный заказ.
              </Dialog.Description>
              {comparing && preview ? (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <section className="rounded-xl border border-border p-3">
                      <h3 className="mb-3 text-sm font-semibold">
                        Сейчас · {sellerNames[comparing.seller]}
                      </h3>
                      <Breakdown quote={comparing.quote} currency="RUB" />
                    </section>
                    <section className="rounded-xl border border-primary/40 bg-primary/5 p-3">
                      <h3 className="mb-3 text-sm font-semibold">
                        Предложение · {sellerNames[targetSeller]}
                      </h3>
                      <Breakdown quote={preview} currency="RUB" />
                    </section>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Цена товара, доставки и услуг зафиксирована в этом
                    сравнении. Расчёт действует 15 минут.
                  </p>
                  {requoted ? (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl border border-border bg-muted p-3 text-sm"
                    >
                      Тариф изменился: доставка 500 ₽ → 700 ₽. Новый итог 7 600
                      ₽ вместо 7 400 ₽. Подтвердите новую цену или отмените
                      смену магазина.
                    </p>
                  ) : null}
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Dialog.Close className={button}>
                      Оставить текущий магазин
                    </Dialog.Close>
                    <button
                      type="button"
                      className={primaryButton}
                      onClick={applyComparison}
                    >
                      {requoted
                        ? "Подтвердить новую цену"
                        : "Выбрать этот магазин"}
                    </button>
                  </div>
                </>
              ) : null}
            </Dialog.Content>
          </Dialog.Root>
        </Dialog.Content>
      </div>
    </Dialog.Root>
  );
}
