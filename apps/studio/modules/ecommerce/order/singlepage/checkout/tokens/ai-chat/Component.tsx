"use client";
import type { IComponentProps, ITokensProps } from "./interface";
export type { ITokensProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";

import {
  type ReactNode,
  useContext,
  createContext,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
} from "react";
import { twMerge as twMerge } from "tailwind-merge";
import Markdown from "markdown-to-jsx";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  IWebsiteSection,
  IAIChatServicePageContent as IAIChatServicePageContentPresentation,
  type IAIChatServicePageContent,
} from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";
import {
  useAIChatAccount,
  useAIChatProjectHref,
} from "../../../../../../rbac/subject/singlepage/me/account/Account";
import defaultCopy from "./content.json";
function PageIntro({ section }: { section: IWebsiteSection }) {
  return (
    <div className="mb-8 max-w-2xl">
      <div className="mb-4 h-1 w-10 rounded-full bg-primary text-primary-foreground" />
      <h1 className="text-3xl font-semibold leading-tight tracking-tight @[640px]:text-4xl">
        {section.title}
      </h1>
      <div className="mt-4">
        <SectionText section={section} />
      </div>
    </div>
  );
}
interface IServicePageProps {
  variant?: string;
  copy: IAIChatServicePageContentPresentation;
  children: ReactNode;
  showIntro?: boolean;
  projectHref?: string;
}
function ServicePage({
  variant = "checkout-tokens-ai-chat",
  copy,
  children,
  showIntro = true,
  projectHref = "/ai-chat/social/profiles/create",
}: IServicePageProps) {
  return (
    <ProjectHrefContext.Provider value={projectHref}>
      <div
        data-sps-theme="singlepage"
        className="@container min-w-0 bg-muted text-foreground font-default"
        data-module="ecommerce"
        data-model="order"
        data-variant={variant}
      >
        <main className="mx-auto max-w-6xl px-5 py-7 @[640px]:px-8 @[640px]:py-10">
          {showIntro ? <PageIntro section={copy.sections.hero} /> : null}
          {children}
        </main>
      </div>
    </ProjectHrefContext.Provider>
  );
}
function MarkdownDocument({
  children,
  hideTitle = false,
  baseUrl,
  resolveLink,
  externalLinksNewTab = false,
  disableRawHTML = false,
  className,
}: {
  children: string;
  hideTitle?: boolean;
  baseUrl?: string;
  resolveLink?: (url: string) =>
    | string
    | {
        href: string;
        target: "_top";
      };
  externalLinksNewTab?: boolean;
  disableRawHTML?: boolean;
  className?: string;
}) {
  const assetUrl = (value: string = "") => {
    if (!baseUrl || /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return value;
    const url = new URL(value, `https://studio.invalid${baseUrl}`);
    return url.pathname + url.search + url.hash;
  };
  return (
    <div
      className={twMerge(
        "min-w-0 max-w-none break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-muted [&_pre]:p-5 [&_pre_code]:whitespace-pre [&_pre_code]:break-normal text-base leading-7 text-muted-foreground [&_a]:text-muted-foreground [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <Markdown
        options={{
          disableParsingRawHTML: disableRawHTML,
          ...(baseUrl || externalLinksNewTab
            ? {
                overrides: {
                  img: {
                    component: ({
                      src,
                      alt,
                      ...props
                    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
                      <img {...props} src={assetUrl(src)} alt={alt ?? ""} />
                    ),
                  },
                  a: {
                    component: ({
                      href,
                      ...props
                    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                      const resolved =
                        resolveLink?.(assetUrl(href)) ?? assetUrl(href);
                      return (
                        <a
                          {...props}
                          {...(typeof resolved === "string"
                            ? { href: resolved }
                            : resolved)}
                          {...(externalLinksNewTab &&
                          /^https?:\/\//i.test(href ?? "")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        />
                      );
                    },
                  },
                },
              }
            : {}),
        }}
      >
        {hideTitle ? children.replace(/^# [^\n]+\n/, "") : children}
      </Markdown>
    </div>
  );
}
interface ISectionTextProps {
  section: IWebsiteSection;
  tone?: "light" | "dark";
  size?: "sm" | "xs";
}
function SectionText({
  section,
  tone = "light",
  size = "sm",
}: ISectionTextProps) {
  const projectHref = useContext(ProjectHrefContext);
  return (
    <div
      className={`space-y-3 ${size === "xs" ? "text-xs [&>div]:text-xs [&>div]:leading-relaxed" : "text-sm"} leading-relaxed [&_p]:m-0 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold ${tone === "dark" ? "text-default-foreground/80 [&_a]:text-default-foreground [&_strong]:text-default-foreground" : "text-muted-foreground [&_a]:text-foreground [&_strong]:text-foreground"}`}
    >
      {section.paragraphs.map((paragraph, index) => (
        <MarkdownDocument key={index}>
          {paragraph.replaceAll(
            "/ai-chat/social/profiles/example",
            projectHref,
          )}
        </MarkdownDocument>
      ))}
    </div>
  );
}
type IconName = keyof typeof IconGlyphs;
interface IPageSectionProps {
  section: IWebsiteSection;
  children?: ReactNode;
  icon?: IconName;
  className?: string;
  contentClassName?: string;
  descriptionSize?: "sm" | "xs";
}
function PageSection({
  section,
  children,
  icon,
  className = "",
  contentClassName = "",
  descriptionSize = "sm",
}: IPageSectionProps) {
  return (
    <section className={`${kit.card} p-5 @[640px]:p-6 ${className}`}>
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        {icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Icon name={icon} />
          </span>
        ) : null}
        {section.title}
      </h2>
      {section.paragraphs.length ? (
        <div className="mt-3">
          <SectionText section={section} size={descriptionSize} />
        </div>
      ) : null}
      {children ? (
        <div className={`mt-5 ${contentClassName}`}>{children}</div>
      ) : null}
    </section>
  );
}
interface IFeedbackProps {
  children: ReactNode;
  kind?: "success" | "error" | "info";
}
function Feedback({ children, kind = "success" }: IFeedbackProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${kind === "error" ? "border-destructive-border bg-destructive-surface text-destructive" : "border-border bg-muted"}`}
    >
      <Icon
        name={
          kind === "error"
            ? "warning"
            : kind === "info"
              ? "question"
              : "check-circle"
        }
        className={kind === "success" ? "text-foreground" : ""}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function Component({
  variant = "checkout-tokens-ai-chat",
  copy = defaultCopy,
}: IComponentProps = {}) {
  const aiChatAccount = useAIChatAccount();
  const { sections, labels } = copy;
  const projectHref = useAIChatProjectHref();
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const price = sections.packages.items.find((item) => item.title === selected);
  const amount = price ? Number(price.title) : 0;
  const rate = price ? Number(price.text) : 0;
  const number = (value: number) =>
    value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return (
    <ServicePage copy={copy} projectHref={projectHref} variant={variant}>
      <div className="grid min-w-0 items-start gap-6 @[900px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl bg-default p-6 text-default-foreground">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-card/10 p-3 text-primary">
                <Icon name="wallet" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  {sections.balance.title}
                </h2>
                <p className="mt-2 text-sm text-default-foreground/70">
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
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-default-foreground/15 pt-5">
              {[
                [labels["free-balance-label"], aiChatAccount.balance?.free],
                [
                  labels["paid-balance-label"],
                  aiChatAccount.balance?.purchased,
                ],
              ].map(([label, balance]) => (
                <div key={label}>
                  <dt className="text-xs text-default-foreground/70">
                    {label}
                  </dt>
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
                    className={`relative flex min-h-28 cursor-pointer flex-col justify-between gap-4 rounded-xl border p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground ${selected === item.title ? "border-foreground bg-muted ring-1 ring-foreground" : "border-border hover:bg-muted"}`}
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
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          {labels.currency}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected === item.title ? "border-transparent bg-primary text-primary-foreground" : "border-border"}`}
                      >
                        {selected === item.title ? (
                          <Icon name="check" className="h-3 w-3" />
                        ) : null}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {labels["rate-label"]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </PageSection>
        </div>
        <PageSection section={sections.purchase} icon="credit-card">
          <dl className="space-y-4 border-y border-border py-5 text-sm">
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
            href={labels["return-href"].replace(
              "/ai-chat/social/profiles/example",
              projectHref,
            )}
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
              className="group border-b border-border last:border-b-0"
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
const ProjectHrefContext = createContext("/ai-chat/social/profiles/create");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  plain: `${buttonBase} text-muted-foreground enabled:hover:text-foreground ${focus}`,
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  muted: "text-muted-foreground",
  focus: focus,
};
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
