import { useId, useState, type AnchorHTMLAttributes } from "react";
import type { IWorkspacePageProps } from "../../../../../utils/pages";
import {
  Icon,
  kit,
} from "../../../../../design/singlepage/interface-kit/primitives";
import { aiChatAccount } from "../../../../../utils/products/ai-chat-account-fixture";
import { Component as RbacModuleSubject } from "../Preview/components/rbac/subject/index";
import { Component as HostModuleLayout } from "../Preview/components/host/layout/index";
import { AccountProvider } from "../Preview/components/rbac/subject/singlepage/account/Account";
import {
  parseProPage,
  proCurrencyFromHref,
  type IProPageContent,
  type ProCurrency,
} from "./content";
import sourceText from "./page.md?raw";
import "../../../../../styles/singlepage.css";

interface IProLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  resolveLink?: IWorkspacePageProps["resolveLink"];
}

interface IProReviewProps {
  content: IProPageContent;
  initialCurrency: ProCurrency;
  resolveLink?: IWorkspacePageProps["resolveLink"];
}

const display =
  "[font-family:var(--workspace-brand-font-display)] font-semibold";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--workspace-brand-foreground)]";
const number = new Intl.NumberFormat("ru-RU");

function ProLink({ href, resolveLink, children, ...props }: IProLinkProps) {
  const destination = resolveLink?.(href) ?? href;
  return (
    <a
      {...props}
      {...(typeof destination === "string"
        ? { href: destination }
        : destination)}
    >
      {children}
    </a>
  );
}

function ProReview({ content, initialCurrency, resolveLink }: IProReviewProps) {
  const [currency, setCurrency] = useState<ProCurrency>(initialCurrency);
  const [reviewing, setReviewing] = useState(false);
  const id = useId();
  const labels = content.labels;
  const price = `${currency === "USD" ? "$" : "₽"}${number.format(content.plan.prices[currency])}`;
  return (
    <main className="mx-auto min-w-0 max-w-6xl px-5 py-8 @3xl:px-8 @3xl:py-12">
      <ProLink
        href={labels["back-href"]}
        resolveLink={resolveLink}
        className={`inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-[var(--workspace-brand-muted)] ${focus}`}
      >
        <Icon name="arrow-left" size={20} />
        {labels.back}
      </ProLink>
      <div className="mt-6 max-w-2xl">
        <h1
          className={`text-balance text-3xl leading-tight @3xl:text-4xl ${display}`}
        >
          {content.hero.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--workspace-brand-muted)]">
          {content.hero.paragraphs[0]}
        </p>
      </div>
      <div className="mt-8 grid min-w-0 items-start gap-6 @[900px]:grid-cols-[minmax(0,1fr)_320px]">
        <section
          aria-labelledby={`${id}-includes`}
          className="min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6 @3xl:p-8"
        >
          <h2 id={`${id}-includes`} className={`text-xl ${display}`}>
            {content.includes.title}
          </h2>
          <p className={`mt-5 text-2xl leading-tight ${display}`}>
            {number.format(content.plan.monthlyTokens)}{" "}
            <span className="text-base font-normal text-[var(--workspace-brand-muted)]">
              {labels["tokens-per-month"]}
            </span>
          </p>
          <ul className="mt-5 space-y-4">
            {content.includes.paragraphs.map((paragraph) => (
              <li
                key={paragraph}
                className="flex gap-3 text-sm leading-6 text-[var(--workspace-brand-muted)]"
              >
                <span className="mt-0.5 shrink-0 text-[var(--workspace-brand-foreground)]">
                  <Icon name="check" size={20} />
                </span>
                <span>{paragraph}</span>
              </li>
            ))}
          </ul>
          <fieldset className="mt-8 border-t border-[var(--workspace-brand-line)] pt-6">
            <legend className="float-left mb-4 w-full text-sm font-medium">
              {labels.currency}
            </legend>
            <div className="clear-both grid grid-cols-1 gap-3 @sm:grid-cols-2">
              {(["USD", "RUB"] as const).map((value) => (
                <label key={value} className="relative min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name={`${id}-currency`}
                    value={value}
                    checked={currency === value}
                    onChange={() => {
                      setCurrency(value);
                      setReviewing(false);
                    }}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-20 flex-col justify-center gap-1 rounded-xl border border-[var(--workspace-brand-line)] p-4 peer-checked:border-[var(--workspace-brand-foreground)] peer-checked:bg-[var(--workspace-brand-background)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[var(--workspace-brand-foreground)]">
                    <span className="text-sm font-semibold">{value}</span>
                    <span className="text-xs leading-5 text-[var(--workspace-brand-muted)]">
                      {value === "USD" ? labels.usd : labels.rub}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-7 border-t border-[var(--workspace-brand-line)] pt-6">
            <h3 className={`text-base ${display}`}>{content.terms.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--workspace-brand-muted)]">
              {content.terms.paragraphs[0]}
            </p>
            <ProLink
              href={labels["topups-href"]}
              resolveLink={resolveLink}
              className={`mt-3 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 ${focus}`}
            >
              {labels.topups}
              <Icon name="arrow-right" size={20} />
            </ProLink>
          </div>
        </section>
        <aside
          aria-labelledby={`${id}-plan`}
          className="min-w-0 rounded-2xl bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)]"
        >
          <h2 id={`${id}-plan`} className={`text-2xl ${display}`}>
            {content.plan.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--workspace-brand-muted-on-primary)]">
            {content.plan.paragraphs[0]}
          </p>
          <div aria-live="polite" aria-atomic="true" className="mt-6">
            <p className={`text-4xl ${display}`}>
              {price}{" "}
              <span className="text-sm font-normal text-[var(--workspace-brand-muted-on-primary)]">
                {labels["per-month"]}
              </span>
            </p>
            <dl className="mt-6 space-y-3 border-y border-white/15 py-5 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-white/70">{labels.allowance}</dt>
                <dd className="font-medium">
                  {number.format(content.plan.monthlyTokens)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-white/70">{labels.currency}</dt>
                <dd className="font-medium">{currency}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-white/70">{labels.period}</dt>
                <dd className="font-medium">{labels.month}</dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            onClick={() => setReviewing(true)}
            aria-describedby={`${id}-preview-note`}
            className={`${kit.button} mt-6 w-full whitespace-normal text-center focus-visible:outline-[var(--workspace-brand-accent)]`}
          >
            {labels.preview}
            <Icon name="eye" size={20} />
          </button>
          <h3 className="mt-5 text-sm font-semibold">
            {content.preview.title}
          </h3>
          <p
            id={`${id}-preview-note`}
            className="mt-2 text-xs leading-5 text-white/70"
          >
            {content.preview.paragraphs[0]}
          </p>
        </aside>
      </div>
      {reviewing ? (
        <section
          role="status"
          aria-labelledby={`${id}-review`}
          className="mt-6 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6"
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <Icon name="eye" size={20} />
            {labels["review-state"]}
          </p>
          <h2 id={`${id}-review`} className={`mt-3 text-xl ${display}`}>
            {content.review.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--workspace-brand-muted)]">
            {content.review.paragraphs[0]}
          </p>
          <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-5 text-sm">
            <div>
              <dt className="text-[var(--workspace-brand-muted)]">
                {labels.plan}
              </dt>
              <dd className="mt-1 font-semibold">{content.plan.title}</dd>
            </div>
            <div>
              <dt className="text-[var(--workspace-brand-muted)]">
                {labels.price}
              </dt>
              <dd className="mt-1 font-semibold">
                {price} {currency} {labels["per-month"]}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--workspace-brand-muted)]">
                {labels.allowance}
              </dt>
              <dd className="mt-1 font-semibold">
                {number.format(content.plan.monthlyTokens)}{" "}
                {labels["tokens-per-month"]}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-[var(--workspace-brand-muted)]">
            {content.preview.paragraphs[0]}
          </p>
        </section>
      ) : null}
      <ProLink
        href={labels["chat-href"]}
        resolveLink={resolveLink}
        className={`${kit.secondary} mt-6 whitespace-normal text-center`}
      >
        {labels.chat}
        <Icon name="arrow-right" size={20} />
      </ProLink>
    </main>
  );
}

export default function Pro({
  text,
  navigationHref,
  resolveLink,
}: IWorkspacePageProps = {}) {
  return (
    <AccountProvider account={aiChatAccount}>
      <HostModuleLayout
        variant="ai-chat-dashboard"
        page="tokens"
        subjectAccount={({ onNavigate }) => (
          <RbacModuleSubject
            variant="account"
            showTokens
            page="tokens"
            onNavigate={onNavigate}
          />
        )}
      >
        <ProReview
          key={navigationHref ?? "pro"}
          content={parseProPage(text ?? sourceText)}
          initialCurrency={proCurrencyFromHref(navigationHref)}
          resolveLink={resolveLink}
        />
      </HostModuleLayout>
    </AccountProvider>
  );
}
