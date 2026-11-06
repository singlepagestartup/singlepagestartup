"use client";

import { memo, useCallback, useId, useState } from "react";
import {
  Component as Product,
  type IProductCardCheckout,
  type IProductCardSelection,
} from "../../../product";
import { Component as SharedIcon } from "../../../../shared/icon";
import type {
  IComponentPropsExtended,
  ITokenPackChoiceProps,
  ITokenCatalogSelection,
} from "./interface";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";
const link = `inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-center text-sm font-semibold text-foreground hover:bg-muted ${focus}`;
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });

const TokenPackChoice = memo(function TokenPackChoice({
  offer,
  selected,
  name,
  onSelect,
}: ITokenPackChoiceProps) {
  const productId = offer.product.id ?? offer.product.slug;
  const price = offer.product.prices?.[0];
  return (
    <label className="relative min-w-0 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={productId}
        checked={selected}
        onChange={() => onSelect(productId)}
        className="peer sr-only"
      />
      <span className="flex min-h-24 flex-col justify-center gap-2 rounded-xl border border-border bg-card p-4 hover:bg-muted peer-checked:border-foreground peer-checked:bg-muted peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-foreground">
        <span className="text-lg font-semibold">
          {price ? number.format(price.amount) : offer.product.priceLabel}{" "}
          <span className="text-xs font-normal">{price?.code}</span>
        </span>
        <span className="text-xs leading-5 text-muted-foreground">
          {number.format(offer.tokens)} tokens
        </span>
      </span>
    </label>
  );
});

export function Component({
  variant,
  pro,
  topups,
  registrationAllowance,
  tokenRate,
  registrationHref,
  chatHref,
  frameworkHref,
  linkTarget,
}: IComponentPropsExtended) {
  const id = useId();
  const [selectedId, setSelectedId] = useState(() => {
    const initial =
      topups.find((offer) => offer.product.prices?.[0]?.amount === 500) ??
      topups[0];
    return initial?.product.id ?? initial?.product.slug;
  });
  const [selection, setSelection] = useState<ITokenCatalogSelection | null>(
    null,
  );
  const selected =
    topups.find(
      (offer) => (offer.product.id ?? offer.product.slug) === selectedId,
    ) ?? topups[0];
  const choose = useCallback((productId: string) => {
    setSelectedId(productId);
    setSelection(null);
  }, []);
  const add = useCallback((value: IProductCardSelection) => {
    setSelection({ action: "cart", selection: value });
  }, []);
  const checkout = useCallback((value: IProductCardCheckout) => {
    setSelection({ action: "checkout", selection: value });
  }, []);
  const reviewed = selection
    ? [pro, ...topups].find(
        (offer) =>
          (offer.product.id ?? offer.product.slug) ===
          selection.selection.productId,
      )
    : undefined;
  const reviewedPrice = reviewed?.product.prices?.find(
    (price) => price.id === selection?.selection.currencyId,
  );

  return (
    <section
      data-module="ecommerce"
      data-model="widget"
      data-variant={variant}
      data-ds-block="ecommerce.widget.token-find"
      data-ds-imports="ecommerce.product.card"
      className="mx-auto w-full min-w-0 max-w-7xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8"
    >
      <section
        aria-labelledby={`${id}-allowance`}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="max-w-2xl">
          <h2 id={`${id}-allowance`} className="text-xl font-semibold">
            Start with {number.format(registrationAllowance)} tokens.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Registration includes this allowance once per account. Your account
            receives it automatically.
          </p>
        </div>
        <a
          href={registrationHref}
          target={linkTarget}
          className={`${link} shrink-0`}
        >
          Create an AI Chat account
          <SharedIcon variant="phosphor" name="arrow-up-right" />
        </a>
      </section>
      <p className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
        <SharedIcon variant="phosphor" name="eye" className="mt-0.5" />
        <span>
          All purchase controls on this page are a local preview. Adding a
          product records a selection here; reviewing checkout creates no order,
          subscription or payment and does not change an account balance.
        </span>
      </p>
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
        <section
          id={`${id}-pro`}
          aria-labelledby={`${id}-pro-title`}
          className="min-w-0"
        >
          <h2 id={`${id}-pro-title`} className="mb-4 text-2xl font-semibold">
            Monthly Pro
          </h2>
          <Product
            {...pro.product}
            variant="card"
            href={`#${id}-pro`}
            onAddToCart={add}
            onCheckout={checkout}
          />
        </section>
        <section aria-labelledby={`${id}-topups`} className="min-w-0">
          <h2 id={`${id}-topups`} className="text-2xl font-semibold">
            One-off token top-ups
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Every package uses the same rate of {number.format(tokenRate)} RUB
            per internal token. Larger packages have no discount. Purchased
            tokens do not expire.
          </p>
          <fieldset className="mt-5">
            <legend className="mb-3 text-sm font-medium">
              Choose a top-up amount
            </legend>
            <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-3">
              {topups.map((offer) => (
                <TokenPackChoice
                  key={offer.product.id ?? offer.product.slug}
                  offer={offer}
                  selected={selected === offer}
                  name={`${id}-topup`}
                  onSelect={choose}
                />
              ))}
            </div>
          </fieldset>
          <div id={`${id}-topup-card`} className="mt-5">
            {selected ? (
              <Product
                key={selected.product.id ?? selected.product.slug}
                {...selected.product}
                variant="card"
                href={`#${id}-topup-card`}
                onAddToCart={add}
                onCheckout={checkout}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No top-ups are supplied in this preview.
              </p>
            )}
          </div>
        </section>
      </div>
      {selection && reviewed ? (
        <section
          role="status"
          aria-labelledby={`${id}-selection`}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <SharedIcon variant="phosphor" name="eye" />
            {selection.action === "cart"
              ? "Last local cart selection"
              : "Last local checkout selection"}
          </p>
          <h2 id={`${id}-selection`} className="mt-3 text-xl font-semibold">
            {reviewed.product.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {reviewedPrice
              ? `${number.format(reviewedPrice.amount)} ${reviewedPrice.code}${reviewedPrice.interval ? ` per ${reviewedPrice.interval}` : " one-off"}`
              : reviewed.product.priceLabel}{" "}
            · {number.format(reviewed.tokens)} internal tokens
            {reviewedPrice?.interval ? " per month" : " estimated credit"}.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            This records your last selection in this preview. Change the
            controls and review again to replace it. No order, payment,
            subscription or token credit has been created.
          </p>
        </section>
      ) : null}
      <section className="grid gap-5 border-t border-border pt-8 sm:grid-cols-[1fr_2fr]">
        <h2 className="text-xl font-semibold">From documents to development</h2>
        <div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Use AI Chat to prepare your business model, concept and project
            documents. Export the reviewed material to brief coding agents that
            develop your product with Code Framework. The framework code is free
            under MIT; AI Chat plans and tokens pay for AI work on your
            materials.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={chatHref} target={linkTarget} className={link}>
              Open AI Chat
              <SharedIcon variant="phosphor" name="arrow-up-right" />
            </a>
            <a href={frameworkHref} target={linkTarget} className={link}>
              Explore Code Framework
              <SharedIcon variant="phosphor" name="code" />
            </a>
          </div>
        </div>
      </section>
    </section>
  );
}
