"use client";
import { type ReactNode as ReactNode } from "react";
import { useContext as useContext } from "react";
import { createContext as createContext } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import Markdown from "markdown-to-jsx";
import { Component as WebsiteBuilderModuleButton } from "../../../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
} from "react";
import IconGlyphs from "../../../../../../website-builder/feature/singlepage/icon/icons.json";
import { IWebsiteSection as IWebsiteSection } from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";
import { IAIChatServicePageContent as IAIChatServicePageContentPresentation } from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";
import { useId, useState } from "react";
import {
  useAIChatAccount,
  useAIChatProjectHref,
} from "../../../../../../rbac/subject/singlepage/account/Account";
import defaultCopy from "./content.json";
import type { IAIChatServicePageContent } from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";
function PageIntro({ section }: { section: IWebsiteSection }) {
  return (
    <div className="mb-8 max-w-2xl">
      <div className="mb-4 h-1 w-10 rounded-full bg-[color:var(--workspace-brand-accent)]" />
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
  copy: IAIChatServicePageContentPresentation;
  children: ReactNode;
  showIntro?: boolean;
  projectHref?: string;
}
function ServicePage({
  copy,
  children,
  showIntro = true,
  projectHref = "/ai-chat/social/profiles/create",
}: IServicePageProps) {
  return (
    <ProjectHrefContext.Provider value={projectHref}>
      <div
        data-workspace-projection="singlepage"
        className="@container min-w-0 bg-[color:var(--workspace-brand-background)] text-[color:var(--workspace-brand-foreground)] font-[family-name:var(--workspace-brand-font-body)]"
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
        "min-w-0 max-w-none break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[color:var(--workspace-brand-background)] [&_pre]:p-5 [&_pre_code]:whitespace-pre [&_pre_code]:break-normal text-base leading-7 text-[color:var(--workspace-brand-muted)] [&_a]:text-[color:var(--workspace-brand-muted)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[color:var(--workspace-brand-line)] [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-[color:var(--workspace-brand-background)] [&_code]:px-1 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-[color:var(--workspace-brand-foreground)] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[color:var(--workspace-brand-foreground)] [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-[color:var(--workspace-brand-foreground)] [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_table]:my-5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-[color:var(--workspace-brand-line)] [&_td]:p-2 [&_th]:border [&_th]:border-[color:var(--workspace-brand-line)] [&_th]:bg-[color:var(--workspace-brand-background)] [&_th]:p-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
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
      className={`space-y-3 ${size === "xs" ? "text-xs [&>div]:text-xs [&>div]:leading-relaxed" : "text-sm"} leading-relaxed [&_p]:m-0 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold ${tone === "dark" ? "text-white/80 [&_a]:text-white [&_strong]:text-white" : "text-[color:var(--workspace-brand-muted)] [&_a]:text-[color:var(--workspace-brand-foreground)] [&_strong]:text-[color:var(--workspace-brand-foreground)]"}`}
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
type IconName =
  | "arrow-down"
  | "arrow-left"
  | "arrow-right"
  | "arrow-square-out"
  | "arrow-up-right"
  | "bank"
  | "bell"
  | "book-open"
  | "bookmark-simple"
  | "calendar-blank"
  | "caret-down"
  | "caret-left"
  | "caret-right"
  | "chart-bar"
  | "chat"
  | "chat-circle"
  | "check"
  | "check-circle"
  | "clock"
  | "code"
  | "confetti"
  | "credit-card"
  | "cube"
  | "currency-circle-dollar"
  | "database"
  | "envelope"
  | "eye"
  | "eye-slash"
  | "file-text"
  | "floppy-disk"
  | "folder-open"
  | "gear-six"
  | "github-logo"
  | "globe"
  | "google-chrome-logo"
  | "hash"
  | "house"
  | "image"
  | "key"
  | "lightning"
  | "link"
  | "link-break"
  | "linkedin-logo"
  | "list"
  | "lock-key"
  | "magnifying-glass"
  | "map-pin"
  | "megaphone"
  | "minus"
  | "monitor"
  | "newspaper"
  | "package"
  | "palette"
  | "paper-plane-tilt"
  | "paperclip"
  | "pencil-simple"
  | "phone"
  | "play"
  | "plus"
  | "push-pin"
  | "question"
  | "robot"
  | "share-network"
  | "shield"
  | "shield-check"
  | "shopping-cart"
  | "sign-in"
  | "sign-out"
  | "smiley"
  | "squares-four"
  | "stack"
  | "star"
  | "tag"
  | "text-b"
  | "text-italic"
  | "thumbs-up"
  | "trash"
  | "trend-up"
  | "twitter-logo"
  | "upload-simple"
  | "user"
  | "user-circle"
  | "user-plus"
  | "users"
  | "wallet"
  | "warning"
  | "x";
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
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--workspace-brand-background)]">
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
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${kind === "error" ? "border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)]" : "border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-background)]"}`}
    >
      <Icon
        name={
          kind === "error"
            ? "warning"
            : kind === "info"
              ? "question"
              : "check-circle"
        }
        className={
          kind === "success"
            ? "text-[color:var(--workspace-brand-foreground)]"
            : ""
        }
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
function Icon({
  name,
  size = 20,
  className = "",
  svgProps,
}: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const geometry = IconGlyphs[name]
    ?.replace(/^\s*<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  if (!geometry) throw new Error("Missing Phosphor icon: " + name);
  return (
    <svg
      className={`shrink-0 ${size === 24 ? "size-6" : "size-5"} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      data-icon-family="phosphor"
      data-icon-name={name}
      data-icon-weight="regular"
      aria-hidden="true"
      focusable="false"
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: geometry }}
    />
  );
}
export interface ITokensProps {
  copy?: IAIChatServicePageContent;
}
export function Component({ copy = defaultCopy }: ITokensProps = {}) {
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
    <ServicePage copy={copy} projectHref={projectHref}>
      <div className="grid min-w-0 items-start gap-6 @[900px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl bg-[color:var(--workspace-brand-foreground)] p-6 text-white">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-white/10 p-3 text-[color:var(--workspace-brand-accent)]">
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
            <div className="mt-5 space-y-2 border-t border-white/15 pt-5">
              <p className="text-sm font-medium">{labels["balance-source"]}</p>
              <p className="text-xs leading-5 text-white/70">
                {labels["balance-scope-note"]}
              </p>
            </div>
          </section>
          <PageSection section={sections.packages} icon="plus">
            <fieldset>
              <legend className="sr-only">{labels["package-label"]}</legend>
              <div className="grid grid-cols-2 gap-3 @[580px]:grid-cols-3">
                {sections.packages.items.map((item) => (
                  <label
                    key={item.title}
                    className={`relative flex min-h-28 cursor-pointer flex-col justify-between gap-4 rounded-xl border p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--workspace-brand-foreground)] ${selected === item.title ? "border-[color:var(--workspace-brand-foreground)] bg-[color:var(--workspace-brand-background)] ring-1 ring-[color:var(--workspace-brand-foreground)]" : "border-[color:var(--workspace-brand-line)] hover:bg-[color:var(--workspace-brand-background)]"}`}
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
                        <span className="ml-1 text-xs font-medium text-[color:var(--workspace-brand-muted)]">
                          {labels.currency}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected === item.title ? "border-transparent bg-[color:var(--workspace-brand-accent)]" : "border-[color:var(--workspace-brand-line)]"}`}
                      >
                        {selected === item.title ? (
                          <Icon name="check" className="h-3 w-3" />
                        ) : null}
                      </span>
                    </span>
                    <span className="text-xs text-[color:var(--workspace-brand-muted)]">
                      {labels["rate-label"]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </PageSection>
        </div>
        <PageSection section={sections.purchase} icon="credit-card">
          <dl className="space-y-4 border-y border-[color:var(--workspace-brand-line)] py-5 text-sm">
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
              className="group border-b border-[color:var(--workspace-brand-line)] last:border-b-0"
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
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[color:var(--workspace-brand-accent)] text-[color:var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] enabled:hover:bg-[color:var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[color:var(--workspace-brand-muted)] enabled:hover:text-[color:var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[color:var(--workspace-brand-danger-line)] bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] px-4 py-2 text-base text-[color:var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[color:var(--workspace-brand-muted)] focus-visible:border-[color:var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[color:var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[color:var(--workspace-brand-background)] disabled:text-[color:var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[color:var(--workspace-brand-background)] aria-invalid:border-[color:var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[color:var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] text-[color:var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[color:var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[color:var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-5",
  muted: "text-[color:var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[color:var(--workspace-brand-foreground)]",
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
