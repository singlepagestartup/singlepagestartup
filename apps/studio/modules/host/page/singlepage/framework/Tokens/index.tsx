"use client";

import { useId, useState } from "react";
import type { IFrameworkPageViewProps } from "../interface";
import { Icon, kit } from "../primitives";
import { PreviewLink, SiteShell, siteStyles } from "../Site";
import sourceText from "./page.md?raw";
import { parseTokenPage, tokenCredit } from "./content";

const integer = new Intl.NumberFormat("ru-RU");
const credit = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export default function Tokens({
  text,
  resolveLink,
}: IFrameworkPageViewProps = {}) {
  const content = parseTokenPage(text ?? sourceText);
  const labels = content.labels;
  const [currency, setCurrency] = useState<"USD" | "RUB">("USD");
  const [selectedAmount, setSelectedAmount] = useState(500);
  const selected =
    content.topups.packages.find(({ amount }) => amount === selectedAmount) ??
    content.topups.packages[0];
  const id = useId();
  const { display, muted, focus } = siteStyles;

  return (
    <SiteShell active="tokens" resolveLink={resolveLink}>
      <main className="mx-auto w-full max-w-7xl space-y-14 px-5 py-10 @3xl:px-8 @3xl:py-16 @5xl:space-y-20">
        <section aria-labelledby={`${id}-title`} className="max-w-3xl">
          <p className={`text-sm font-medium ${muted}`}>
            {content.hero.paragraphs[0]}
          </p>
          <h1
            id={`${id}-title`}
            className={`mt-4 text-balance text-4xl leading-[1.08] @3xl:text-5xl @5xl:text-6xl ${display}`}
          >
            {content.hero.title}
          </h1>
          <p className={`mt-6 max-w-2xl text-lg leading-8 ${muted}`}>
            {content.hero.paragraphs[1]}
          </p>
          <p className={`mt-4 max-w-2xl text-sm leading-6 ${muted}`}>
            {content.hero.paragraphs[2]}
          </p>
        </section>

        <section
          aria-labelledby={`${id}-allowance`}
          className="flex flex-col gap-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:p-7"
        >
          <div className="max-w-2xl">
            <h2 id={`${id}-allowance`} className={`text-xl ${display}`}>
              {content.allowance.title}
            </h2>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>
              {content.allowance.paragraphs[0]}
            </p>
          </div>
          <PreviewLink
            href={labels["register-href"]}
            resolveLink={resolveLink}
            className={`${kit.secondary} shrink-0 whitespace-normal text-center ${focus}`}
          >
            {labels.register}
            <Icon name="arrow-up-right" size={20} />
          </PreviewLink>
        </section>

        <div className="grid min-w-0 items-start gap-6 @5xl:grid-cols-[0.9fr_1.4fr]">
          <section
            aria-labelledby={`${id}-pro`}
            className="min-w-0 rounded-3xl bg-[hsl(var(--default))] p-6 text-[hsl(var(--default-foreground))] @3xl:p-8"
          >
            <p className="text-sm text-[hsl(var(--default-muted-foreground))]">
              {labels["pro-eyebrow"]}
            </p>
            <h2 id={`${id}-pro`} className={`mt-3 text-3xl ${display}`}>
              {content.pro.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--default-muted-foreground))]">
              {content.pro.paragraphs[0]}
            </p>
            <fieldset className="mt-7">
              <legend className="mb-3 text-sm text-[hsl(var(--default-muted-foreground))]">
                {labels.currency}
              </legend>
              <div className="inline-flex gap-1 rounded-xl border border-white/20 p-1">
                {(["USD", "RUB"] as const).map((value) => (
                  <label key={value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name={`${id}-currency`}
                      value={value}
                      checked={currency === value}
                      onChange={() => setCurrency(value)}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-11 min-w-16 items-center justify-center rounded-lg px-4 text-sm peer-checked:bg-[hsl(var(--primary))] peer-checked:text-[hsl(var(--primary-foreground))] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[hsl(var(--primary))]">
                      {value}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-[hsl(var(--default-muted-foreground))]">
                {content.pro.paragraphs[2]}
              </p>
            </fieldset>
            <div aria-live="polite" aria-atomic="true" className="mt-6">
              <p
                className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 text-5xl ${display}`}
              >
                <span>
                  {currency === "USD" ? "$" : "₽"}
                  {integer.format(content.pro.prices[currency])}
                </span>
                <span className="text-sm font-normal text-[hsl(var(--default-muted-foreground))]">
                  {labels["per-month"]}
                </span>
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm">
                <Icon name="check" size={20} />
                {integer.format(content.pro.monthlyTokens)}{" "}
                {labels["token-unit"]}
              </p>
            </div>
            <p className="mt-2 text-sm text-[hsl(var(--default-muted-foreground))]">
              {content.pro.paragraphs[1]}
            </p>
            <PreviewLink
              href={`${labels["pro-review-href"]}?currency=${currency}`}
              resolveLink={resolveLink}
              aria-describedby={`${id}-handoff`}
              className={`${kit.button} mt-8 w-full whitespace-normal text-center ${focus}`}
            >
              {labels["pro-review"]}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </section>

          <section
            aria-labelledby={`${id}-topups`}
            className="min-w-0 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 @3xl:p-8"
          >
            <h2
              id={`${id}-topups`}
              className={`text-2xl leading-tight @3xl:text-3xl ${display}`}
            >
              {content.topups.title}
            </h2>
            <p className={`mt-4 text-sm leading-6 ${muted}`}>
              {content.topups.paragraphs[0]}
            </p>
            <fieldset className="mt-6">
              <legend className={`mb-3 text-sm font-medium ${muted}`}>
                {labels["package-label"]}
              </legend>
              <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @3xl:grid-cols-3">
                {content.topups.packages.map((pack) => (
                  <label
                    key={pack.amount}
                    className="relative min-w-0 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`${id}-package`}
                      value={pack.amount}
                      checked={selected?.amount === pack.amount}
                      onChange={() => setSelectedAmount(pack.amount)}
                      className="peer sr-only"
                    />
                    <span className="flex h-full min-h-24 flex-col justify-center gap-2 rounded-xl border border-[hsl(var(--border))] p-4 transition-colors hover:bg-[hsl(var(--muted))] peer-checked:border-[hsl(var(--foreground))] peer-checked:bg-[hsl(var(--muted))] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[hsl(var(--foreground))]">
                      <span className={`text-xl ${display}`}>
                        {integer.format(pack.amount)}{" "}
                        <span className="text-sm font-normal">
                          {labels["amount-unit"]}
                        </span>
                      </span>
                      <span className={`text-xs leading-5 ${muted}`}>
                        {credit.format(tokenCredit(pack))}{" "}
                        {labels["token-unit"]}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {selected ? (
              <div
                aria-live="polite"
                aria-atomic="true"
                className="mt-6 rounded-2xl bg-[hsl(var(--muted))] p-5"
              >
                <p className={`text-xs font-medium ${muted}`}>
                  {labels.selected}
                </p>
                <dl className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className={`text-sm ${muted}`}>{labels["one-off"]}</dt>
                    <dd className={`text-2xl ${display}`}>
                      {integer.format(selected.amount)} {labels["amount-unit"]}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className={`text-sm ${muted}`}>{labels.estimate}</dt>
                    <dd className="text-sm font-medium tabular-nums">
                      {credit.format(tokenCredit(selected))}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
            <p className={`mt-4 text-xs leading-5 ${muted}`}>
              {labels["estimate-note"]}
            </p>
            <PreviewLink
              href={labels["checkout-href"]}
              resolveLink={resolveLink}
              aria-describedby={`${id}-handoff`}
              className={`${kit.button} mt-6 w-full whitespace-normal text-center ${focus}`}
            >
              {labels.continue}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
            <p className={`mt-4 text-sm leading-6 ${muted}`}>
              {content.topups.paragraphs[1]}
            </p>
          </section>
        </div>

        <section
          id={`${id}-handoff`}
          aria-labelledby={`${id}-handoff-title`}
          className="flex gap-3 rounded-2xl bg-[hsl(var(--muted))] p-5"
        >
          <span className="mt-0.5 shrink-0">
            <Icon name="eye" size={20} />
          </span>
          <div>
            <h2 id={`${id}-handoff-title`} className={`text-base ${display}`}>
              {content.handoff.title}
            </h2>
            <p className={`mt-2 max-w-3xl text-sm leading-6 ${muted}`}>
              {content.handoff.paragraphs[0]}
            </p>
          </div>
        </section>

        <section
          aria-labelledby={`${id}-terms`}
          className="grid gap-4 border-t border-[hsl(var(--border))] pt-8 @3xl:grid-cols-[1fr_2fr] @3xl:gap-8"
        >
          <h2 id={`${id}-terms`} className={`text-xl ${display}`}>
            {content.terms.title}
          </h2>
          <div className={`space-y-3 text-sm leading-6 ${muted}`}>
            {content.terms.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <PreviewLink
              href={labels["terms-href"]}
              resolveLink={resolveLink}
              className={`inline-flex items-center gap-2 font-medium text-[hsl(var(--foreground))] underline underline-offset-4 ${focus}`}
            >
              {labels.terms}
              <Icon name="arrow-up-right" size={20} />
            </PreviewLink>
          </div>
        </section>

        <section
          aria-labelledby={`${id}-framework`}
          className="rounded-3xl border border-[hsl(var(--border))] p-6 @3xl:p-8"
        >
          <h2
            id={`${id}-framework`}
            className={`max-w-2xl text-balance text-2xl @3xl:text-3xl ${display}`}
          >
            {content.framework.title}
          </h2>
          <p className={`mt-4 max-w-2xl text-base leading-7 ${muted}`}>
            {content.framework.paragraphs[0]}
          </p>
          <div className="mt-6 flex flex-col gap-3 @sm:flex-row @sm:flex-wrap">
            <PreviewLink
              href={labels["framework-href"]}
              resolveLink={resolveLink}
              className={`${kit.secondary} whitespace-normal text-center ${focus}`}
            >
              <Icon name="code" size={20} />
              {labels.framework}
            </PreviewLink>
            <PreviewLink
              href={labels["chat-href"]}
              resolveLink={resolveLink}
              className={`${kit.plain} whitespace-normal text-center ${focus}`}
            >
              {labels.chat}
              <Icon name="arrow-right" size={20} />
            </PreviewLink>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
