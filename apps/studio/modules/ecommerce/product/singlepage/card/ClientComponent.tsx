"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { twMerge } from "tailwind-merge";
import { Component as SharedIcon } from "../../../../shared/icon";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button";
import type {
  IComponentPropsExtended,
  IProductCardCheckout,
  IProductCardSelection,
} from "./interface";

const focusClassName =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const fieldClassName =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function Component(props: IComponentPropsExtended) {
  const instanceId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [currencyId, setCurrencyId] = useState(props.initialCurrencyId);
  const maxQuantity = Math.max(1, props.maxQuantity ?? 99);
  const [quantity, setQuantity] = useState(
    Math.min(maxQuantity, Math.max(1, props.initialQuantity ?? 1)),
  );
  const [optionValues, setOptionValues] = useState(
    props.initialOptionValues ?? {},
  );
  const [checkoutOpen, setCheckoutOpen] = useState(
    props.initialCheckoutOpen ?? false,
  );
  const [providerId, setProviderId] = useState<string>();
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState<"cart" | "checkout" | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string>();
  const [orderPreview, setOrderPreview] = useState<IProductCardCheckout>();
  const price =
    props.prices.find((item) => item.id === currencyId) ?? props.prices[0];
  const methods = props.paymentMethods.filter(
    (method) =>
      !method.currencyIds || (price && method.currencyIds.includes(price.id)),
  );
  const provider =
    methods.find((method) => method.id === providerId) ?? methods[0];
  const selectedOptions = props.options.map((option) => ({
    option,
    value:
      option.values.find(
        (value) => value.id === optionValues[option.id] && !value.disabled,
      ) ?? option.values.find((value) => !value.disabled),
  }));
  const selectedOptionValues = Object.fromEntries(
    selectedOptions.flatMap(({ option, value }) =>
      value ? [[option.id, value.id]] : [],
    ),
  );
  const total = price
    ? (price.amount +
        selectedOptions.reduce(
          (sum, { value }) => sum + (value?.priceAdjustments?.[price.id] ?? 0),
          0,
        )) *
      quantity
    : 0;
  const available = props.available !== false;
  const canPurchase =
    available && Boolean(price) && selectedOptions.every(({ value }) => value);
  const visibleCount = Math.max(0, props.visibleAttributeCount ?? 3);
  const visibleAttributes = expanded
    ? props.attributes
    : props.attributes.slice(0, visibleCount);
  const href = props.href ?? `/ecommerce/products/${props.slug}`;
  const titleId = `${instanceId}-title`;
  const attributesId = `${instanceId}-attributes`;
  const checkoutId = `${instanceId}-checkout`;

  function money(amount: number) {
    if (!price) return props.priceLabel;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: price.code,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${price.symbol}${amount.toLocaleString("en-US")}`;
    }
  }

  function clearFeedback() {
    setAdded(false);
    setError(undefined);
    setOrderPreview(undefined);
  }

  function selection(): IProductCardSelection {
    return {
      productId: props.id ?? props.slug,
      quantity,
      currencyId: price!.id,
      optionValues: selectedOptionValues,
    };
  }

  async function addToCart() {
    if (!canPurchase || pending) return;
    clearFeedback();
    setPending("cart");
    try {
      await props.onAddToCart?.(selection());
      setAdded(true);
    } catch {
      setError("Could not add this item. Please try again.");
    } finally {
      setPending(null);
    }
  }

  function openCheckout() {
    clearFeedback();
    setCheckoutOpen(true);
    requestAnimationFrame(() => emailRef.current?.focus());
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPurchase || !provider || pending) return;
    const order: IProductCardCheckout = {
      ...selection(),
      providerId: provider.id,
      email: email.trim(),
      comment: comment.trim(),
    };
    setError(undefined);
    setPending("checkout");
    try {
      await props.onCheckout?.(order);
      setOrderPreview(order);
    } catch {
      setError("Could not prepare your order. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <article
      aria-labelledby={titleId}
      data-ds-block="ecommerce.product.card"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant="card"
      className={twMerge(
        "flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground",
        props.className,
      )}
    >
      {props.showMedia !== false ? (
        <a
          href={href}
          target={props.target}
          rel={props.target === "_blank" ? "noreferrer" : undefined}
          aria-label={`View ${props.title}`}
          className={twMerge(
            "relative block aspect-[16/9] overflow-hidden bg-muted",
            focusClassName,
          )}
        >
          <img
            src={props.media?.[0]?.src ?? props.image}
            alt={props.media?.[0]?.alt ?? ""}
            className="h-full w-full object-cover"
          />
          {props.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1 text-xs font-medium text-card-foreground">
              {props.badge}
            </span>
          )}
        </a>
      ) : null}
      {props.showMedia !== false && props.media && props.media.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b border-border p-3">
          {props.media.map((item) => (
            <a
              key={item.id}
              href={item.src}
              target="_blank"
              rel="noreferrer"
              aria-label={item.alt}
              className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="size-16 rounded-lg object-cover"
              />
            </a>
          ))}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <header className="space-y-2">
          {props.categories?.length ? (
            <div className="flex flex-wrap gap-2">
              {props.categories.map((category) => (
                <a
                  key={category.id}
                  href={category.href}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {category.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">
              {props.category}
            </p>
          )}
          <h3
            id={titleId}
            className="text-2xl font-semibold leading-tight tracking-tight"
          >
            <a
              href={href}
              target={props.target}
              rel={props.target === "_blank" ? "noreferrer" : undefined}
              className={twMerge("rounded-sm", focusClassName)}
            >
              {props.title}
            </a>
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {props.shortDescription || props.subtitle}
          </p>
        </header>

        {props.attributes.length > 0 && (
          <section aria-label="Product details" className="space-y-2.5">
            <dl id={attributesId} className="space-y-2.5 text-sm">
              {visibleAttributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4"
                >
                  <dt className="text-muted-foreground">{attribute.label}</dt>
                  <dd className="text-right font-medium [overflow-wrap:anywhere]">
                    {attribute.value}
                  </dd>
                </div>
              ))}
            </dl>
            {props.attributes.length > visibleCount && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={attributesId}
                onClick={() => setExpanded(!expanded)}
                className={twMerge(
                  "flex min-h-8 items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground",
                  focusClassName,
                )}
              >
                {expanded
                  ? "Fewer details"
                  : `All ${props.attributes.length} details`}
                <SharedIcon
                  variant="phosphor"
                  name="caret-down"
                  className={twMerge("size-3.5", expanded && "rotate-180")}
                />
              </button>
            )}
          </section>
        )}

        {props.options.map((option) => (
          <fieldset
            key={option.id}
            disabled={!available || Boolean(pending)}
            className="min-w-0 space-y-2"
          >
            <legend className="mb-2 text-xs font-medium">{option.label}</legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => (
                <label key={value.id} className="relative">
                  <input
                    type="radio"
                    className="peer sr-only"
                    name={`${instanceId}-option-${option.id}`}
                    value={value.id}
                    checked={selectedOptionValues[option.id] === value.id}
                    disabled={value.disabled}
                    onChange={() => {
                      setOptionValues({
                        ...optionValues,
                        [option.id]: value.id,
                      });
                      clearFeedback();
                    }}
                  />
                  <span className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs peer-checked:border-foreground peer-checked:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed peer-disabled:opacity-40">
                    {value.label}
                    {price && Boolean(value.priceAdjustments?.[price.id]) && (
                      <span className="text-muted-foreground">
                        +{money(value.priceAdjustments![price.id])}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="mt-auto border-t border-border pt-5">
          {price ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <fieldset
                  disabled={!available || Boolean(pending)}
                  className="min-w-0"
                >
                  <legend className="mb-2 text-xs font-medium text-muted-foreground">
                    Currency
                  </legend>
                  <div className="inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1">
                    {props.prices.map((item) => (
                      <label key={item.id} className="relative">
                        <input
                          type="radio"
                          className="peer sr-only"
                          name={`${instanceId}-currency`}
                          value={item.id}
                          checked={price.id === item.id}
                          onChange={() => {
                            setCurrencyId(item.id);
                            clearFeedback();
                          }}
                        />
                        <span className="flex min-h-9 cursor-pointer items-center rounded-lg px-3 text-xs font-medium text-muted-foreground peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-not-allowed">
                          {item.code}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset disabled={!available || Boolean(pending)}>
                  <legend className="mb-2 text-xs font-medium text-muted-foreground">
                    {props.quantityLabel ?? "Quantity"}
                  </legend>
                  <div className="flex h-11 items-center rounded-xl border border-border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                      className={twMerge(
                        "flex size-10 items-center justify-center rounded-lg disabled:opacity-30",
                        focusClassName,
                      )}
                      onClick={() => {
                        setQuantity(quantity - 1);
                        clearFeedback();
                      }}
                    >
                      <SharedIcon
                        variant="phosphor"
                        name="minus"
                        className="size-4"
                      />
                    </button>
                    <output
                      aria-label="Quantity"
                      className="min-w-6 text-center text-sm tabular-nums"
                    >
                      {quantity}
                    </output>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={quantity >= maxQuantity}
                      className={twMerge(
                        "flex size-10 items-center justify-center rounded-lg disabled:opacity-30",
                        focusClassName,
                      )}
                      onClick={() => {
                        setQuantity(quantity + 1);
                        clearFeedback();
                      }}
                    >
                      <SharedIcon
                        variant="phosphor"
                        name="plus"
                        className="size-4"
                      />
                    </button>
                  </div>
                </fieldset>
              </div>

              <div className="space-y-1">
                <div
                  className="flex flex-wrap items-baseline gap-2"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">
                    {money(total)}
                  </span>
                  {price.interval && (
                    <span className="text-sm text-muted-foreground">
                      / {price.interval}
                    </span>
                  )}
                  {price.compareAtAmount &&
                    price.compareAtAmount > price.amount && (
                      <del className="text-sm text-muted-foreground">
                        {money(price.compareAtAmount * quantity)}
                      </del>
                    )}
                  {quantity > 1 && (
                    <span className="text-xs text-muted-foreground">
                      for {quantity} items
                    </span>
                  )}
                </div>
                {props.priceNote && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {props.priceNote}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                <WebsiteBuilderModuleButton
                  variant="control"
                  appearance="secondary"
                  type="button"
                  onClick={addToCart}
                  disabled={!canPurchase || Boolean(pending)}
                >
                  <SharedIcon
                    variant="phosphor"
                    name={
                      pending === "cart"
                        ? "spinner-gap"
                        : added
                          ? "check"
                          : "shopping-cart"
                    }
                    className={twMerge(
                      "size-4 shrink-0",
                      pending === "cart" && "animate-spin",
                    )}
                  />
                  {pending === "cart"
                    ? "Adding…"
                    : added
                      ? "Added to cart"
                      : "Add to cart"}
                </WebsiteBuilderModuleButton>
                <WebsiteBuilderModuleButton
                  variant="control"
                  appearance="primary"
                  type="button"
                  onClick={openCheckout}
                  disabled={!canPurchase || !provider || Boolean(pending)}
                  aria-expanded={checkoutOpen}
                  aria-controls={checkoutId}
                >
                  <SharedIcon
                    variant="phosphor"
                    name="lightning"
                    className="size-4 shrink-0"
                  />
                  Buy now
                </WebsiteBuilderModuleButton>
              </div>
              <div aria-live="polite" className="text-xs text-muted-foreground">
                {!available
                  ? "Currently unavailable."
                  : !selectedOptions.every(({ value }) => value)
                    ? "This configuration is unavailable."
                    : !provider
                      ? "No payment methods for this currency. You can still add it to your cart."
                      : added
                        ? `${quantity} ${quantity === 1 ? "item" : "items"} added · ${money(total)}`
                        : "Buy now to choose a payment method."}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xl font-semibold">{props.priceLabel}</span>
              <a
                href={href}
                target={props.target}
                rel={props.target === "_blank" ? "noreferrer" : undefined}
                className={twMerge(
                  "flex min-h-11 items-center gap-2 rounded-md text-sm font-medium",
                  focusClassName,
                )}
              >
                Details
                <SharedIcon
                  variant="phosphor"
                  name="arrow-up-right"
                  className="size-4"
                />
              </a>
            </div>
          )}
        </div>

        {price && checkoutOpen && (
          <section
            id={checkoutId}
            aria-labelledby={`${checkoutId}-title`}
            className="space-y-4 border-t border-border pt-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h4
                id={`${checkoutId}-title`}
                className="text-base font-semibold"
              >
                {orderPreview ? "Order preview" : "Quick checkout"}
              </h4>
              <button
                type="button"
                aria-label="Close quick checkout"
                disabled={Boolean(pending)}
                onClick={() => {
                  setCheckoutOpen(false);
                  setError(undefined);
                }}
                className={twMerge(
                  "flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted",
                  focusClassName,
                )}
              >
                <SharedIcon variant="phosphor" name="x" className="size-4" />
              </button>
            </div>
            {orderPreview ? (
              <div className="space-y-4 rounded-xl bg-muted p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <SharedIcon
                    variant="phosphor"
                    name="check-circle"
                    className="size-5"
                  />
                  Your order is ready to review
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="font-medium">
                      {money(total)}
                      {price.interval && ` / ${price.interval}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Payment</dt>
                    <dd>{provider?.description}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="min-w-0 break-all text-right">
                      {orderPreview.email}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This is an order preview. No payment has been taken.
                </p>
                <WebsiteBuilderModuleButton
                  variant="control"
                  appearance="secondary"
                  type="button"
                  onClick={() => setOrderPreview(undefined)}
                  className="w-full"
                >
                  Edit order
                </WebsiteBuilderModuleButton>
              </div>
            ) : (
              <form onSubmit={checkout} className="space-y-4">
                <fieldset
                  disabled={!available || Boolean(pending)}
                  className="space-y-3"
                >
                  <legend className="mb-2 text-xs font-medium">
                    Payment method
                  </legend>
                  {methods.map((method) => (
                    <label key={method.id} className="relative block">
                      <input
                        type="radio"
                        name={`${instanceId}-provider`}
                        value={method.id}
                        checked={provider?.id === method.id}
                        onChange={() => {
                          setProviderId(method.id);
                          setError(undefined);
                        }}
                        className="peer sr-only"
                      />
                      <span className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 peer-checked:border-foreground peer-checked:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50">
                        <SharedIcon
                          variant="phosphor"
                          name={method.icon ?? "credit-card"}
                          className="size-5 shrink-0"
                        />
                        <span className="flex-1">
                          <span className="block text-sm font-medium">
                            {method.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {method.description}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={twMerge(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            provider?.id === method.id
                              ? "border-foreground bg-foreground text-background"
                              : "border-border",
                          )}
                        >
                          {provider?.id === method.id && (
                            <SharedIcon
                              variant="phosphor"
                              name="check"
                              className="size-3"
                            />
                          )}
                        </span>
                      </span>
                    </label>
                  ))}
                  {methods.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Choose another currency to see payment methods.
                    </p>
                  )}
                </fieldset>
                <label
                  className="block space-y-2 text-xs font-medium"
                  htmlFor={`${instanceId}-email`}
                >
                  <span>Email for your order</span>
                  <input
                    ref={emailRef}
                    id={`${instanceId}-email`}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                    disabled={Boolean(pending) || !available}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={fieldClassName}
                  />
                </label>
                <label
                  className="block space-y-2 text-xs font-medium"
                  htmlFor={`${instanceId}-comment`}
                >
                  <span>
                    Order note{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </span>
                  <textarea
                    id={`${instanceId}-comment`}
                    name="comment"
                    placeholder="Anything we should know?"
                    rows={2}
                    disabled={Boolean(pending) || !available}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className={twMerge(fieldClassName, "resize-y")}
                  />
                </label>
                <WebsiteBuilderModuleButton
                  variant="control"
                  appearance="primary"
                  type="submit"
                  disabled={!canPurchase || !provider || Boolean(pending)}
                  className="w-full"
                >
                  <SharedIcon
                    variant="phosphor"
                    name={
                      pending === "checkout" ? "spinner-gap" : "arrow-right"
                    }
                    className={twMerge(
                      "size-4",
                      pending === "checkout" && "animate-spin",
                    )}
                  />
                  {pending === "checkout"
                    ? "Preparing…"
                    : `Review order · ${money(total)}`}
                </WebsiteBuilderModuleButton>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {price.interval
                    ? `Recurring payment · every ${price.interval}. `
                    : "One-time payment. "}
                  Storybook preview — no payment will be made.
                </p>
              </form>
            )}
          </section>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
