"use client";
import { useId, useState } from "react";
import { useAIChatAccount } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import {
  Button,
  Icon,
  kit,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import defaultCopy from "./content.json";
import type { IAIChatServicePageContent } from "../../../../../../workspace/utils/products/ai-chat-content";
import {
  Feedback,
  PageSection,
  SectionText,
  ServicePage,
} from "../../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

export interface ITokensProps {
  copy?: IAIChatServicePageContent;
}

export function Component({ copy = defaultCopy }: ITokensProps = {}) {
  const aiChatAccount = useAIChatAccount();
  const { sections, labels } = copy;
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const price = sections.packages.items.find((item) => item.title === selected);
  const amount = price ? Number(price.title) : 0;
  const rate = price ? Number(price.text) : 0;
  const number = (value: number) =>
    value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return (
    <ServicePage copy={copy} page="tokens">
      <div className="grid min-w-0 items-start gap-6 @[900px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl bg-sps-graphite p-6 text-white">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-white/10 p-3 text-sps-green">
                <Icon name="wallet" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  {sections.balance.title}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  {aiChatAccount.balance
                    ? number(
                        aiChatAccount.balance?.free +
                          aiChatAccount.balance?.purchased,
                      )
                    : "—"}{" "}
                  {labels["balance-unit"]}
                </p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
              {[
                [labels["free-balance-label"], aiChatAccount.balance?.free],
                [
                  labels["paid-balance-label"],
                  aiChatAccount.balance?.purchased,
                ],
              ].map(([label, balance]) => (
                <div key={label}>
                  <dt className="text-xs text-white/70">{label}</dt>
                  <dd className="mt-2 text-2xl font-semibold">
                    {typeof balance === "number" ? number(balance) : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <PageSection section={sections.packages} icon="plus">
            <fieldset>
              <legend className="sr-only">{labels["package-label"]}</legend>
              <div className="grid grid-cols-2 gap-3 @[580px]:grid-cols-3">
                {sections.packages.items.map((item) => (
                  <label
                    key={item.title}
                    className={`relative flex min-h-28 cursor-pointer flex-col justify-between gap-4 rounded-xl border p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sps-graphite ${selected === item.title ? "border-sps-graphite bg-sps-grey ring-1 ring-sps-graphite" : "border-sps-line hover:bg-sps-grey"}`}
                  >
                    <input
                      type="radio"
                      name={`${id}-package`}
                      value={item.title}
                      checked={selected === item.title}
                      onChange={() => {
                        setSelected(item.title);
                        setReviewing(false);
                      }}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xl font-semibold">
                        {number(Number(item.title))}
                        <span className="ml-1 text-xs font-medium text-sps-muted">
                          {labels.currency}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected === item.title ? "border-transparent bg-sps-green" : "border-sps-line"}`}
                      >
                        {selected === item.title ? (
                          <Icon name="check" className="h-3 w-3" />
                        ) : null}
                      </span>
                    </span>
                    <span className="text-xs text-sps-muted">
                      {labels["rate-label"]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </PageSection>
        </div>
        <PageSection section={sections.purchase} icon="credit-card">
          <dl className="space-y-4 border-y border-sps-line py-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className={kit.muted}>{labels["selected-label"]}</dt>
              <dd className="font-semibold">
                {selected
                  ? `${number(amount)} ${labels.currency}`
                  : labels["select-prompt"]}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className={kit.muted}>{labels["token-amount-label"]}</dt>
              <dd className="text-right font-semibold">
                {selected ? `≈ ${number(amount / rate)}` : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className={kit.muted}>{labels["total-label"]}</dt>
              <dd className="text-xl font-semibold">
                {selected ? `${number(amount)} ${labels.currency}` : "—"}
              </dd>
            </div>
          </dl>
          {selected ? (
            <p className={`mt-3 text-xs leading-relaxed ${kit.muted}`}>
              {labels["credit-note"]}
            </p>
          ) : null}
          <Button
            disabled={!selected}
            className="mt-5 w-full"
            onClick={() => setReviewing(true)}
          >
            {labels["continue-payment"]}
            <Icon name="arrow-right" />
          </Button>
          {reviewing ? (
            <div className="mt-5 space-y-3">
              <Feedback kind="info">{labels["success-message"]}</Feedback>
              <SectionText section={sections.success} />
            </div>
          ) : null}
          <a
            className={`${kit.plain} mt-3 w-full px-0`}
            href={labels["return-href"]}
          >
            {labels["return-without-buying"]}
          </a>
          <a
            className={`mt-3 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 ${kit.focus}`}
            href={labels["help-href"]}
          >
            <Icon name="question" />
            {labels["help-label"]}
          </a>
        </PageSection>
        <section
          className={`${kit.card} @[900px]:col-span-2`}
          aria-label={labels["terms-label"]}
        >
          {[
            sections.debt,
            sections.charging,
            sections.refunds,
            sections.recovery,
          ].map((section) => (
            <details
              key={section.title}
              className="group border-b border-sps-line last:border-b-0"
            >
              <summary
                className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold ${kit.focus}`}
              >
                {section.title}
                <Icon name="caret-down" className="group-open:rotate-180" />
              </summary>
              <div className="pb-5">
                <SectionText section={section} />
              </div>
            </details>
          ))}
        </section>
      </div>
    </ServicePage>
  );
}
