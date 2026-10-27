"use client";
import {
  type ReactNode as ReactNode,
  useContext as useContext,
  createContext as createContext,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useRef,
  useState,
} from "react";

import { twMerge as twMerge } from "tailwind-merge";
import Markdown from "markdown-to-jsx";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";

import IconGlyphs from "../../../../website-builder/feature/singlepage/icon/icons.json";
import {
  IWebsiteSection as IWebsiteSection,
  type IAIChatServicePageContent,
} from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import defaultCopy from "./content.json";
import { useAIChatAccount } from "../account/Account";

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
export interface ISettingsProps {
  copy?: IAIChatServicePageContent;
  section?: "purchases" | "data";
  showTokens?: boolean;
}
export function Component({
  copy = defaultCopy,
  section = "data",
  showTokens = false,
}: ISettingsProps = {}) {
  const aiChatAccount = useAIChatAccount();
  const { sections, labels } = copy;
  const id = useId();
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deletionChecked, setDeletionChecked] = useState(false);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <div
      data-ds-block="rbac.subject.account-data"
      className="grid min-w-0 gap-5"
    >
      {section === "purchases" ? (
        <>
          <PageSection
            section={
              showTokens
                ? sections.purchases
                : {
                    title: "Покупки",
                    paragraphs: ["Посмотрите историю покупок и чеки."],
                    items: [],
                    links: [],
                  }
            }
            icon="wallet"
          >
            {showTokens && (
              <p className="mt-4 text-sm text-[color:var(--workspace-brand-muted)]">
                {aiChatAccount.balance
                  ? `${(aiChatAccount.balance.free + aiChatAccount.balance.purchased).toLocaleString("ru-RU")} доступных токенов`
                  : "Баланс недоступен"}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              {showTokens && (
                <a href={labels["tokens-href"]} className={kit.button}>
                  <Icon name="plus" />
                  {labels["buy-tokens"]}
                </a>
              )}
              <Button
                variant="secondary"
                aria-expanded={purchasesOpen}
                aria-controls={`${id}-purchases`}
                onClick={() => setPurchasesOpen((current) => !current)}
              >
                <Icon name="credit-card" />
                {labels["purchases-label"]}
              </Button>
            </div>
            {purchasesOpen && (
              <div
                id={`${id}-purchases`}
                className="mt-5 rounded-xl bg-[color:var(--workspace-brand-background)] p-4 text-sm leading-6 text-[color:var(--workspace-brand-muted)]"
                role="status"
              >
                {labels["purchases-empty"]}
              </div>
            )}
          </PageSection>
        </>
      ) : (
        <>
          <PageSection section={sections.privacy} icon="shield">
            <div className="mt-6 border-t border-[color:var(--workspace-brand-danger-line)] pt-6">
              <h3 className="text-lg font-semibold">{sections.danger.title}</h3>
              <SectionText section={sections.danger} />
              <div ref={setPortal} className="mt-5">
                <AlertDialog.Root
                  open={deletionOpen}
                  onOpenChange={setDeletionOpen}
                >
                  <AlertDialog.Trigger asChild>
                    <Button variant="danger">
                      <Icon name="trash" />
                      {labels["delete-label"]}
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal container={portal}>
                    <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
                    <AlertDialog.Content
                      className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-6 font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] shadow-xl"
                      onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        cancel.current?.focus();
                      }}
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--workspace-brand-danger-surface)] text-[color:var(--workspace-brand-danger)]">
                        <Icon name="trash" size={24} />
                      </div>
                      <AlertDialog.Title className="text-2xl font-semibold leading-tight">
                        {labels["deletion-title"]}
                      </AlertDialog.Title>
                      <AlertDialog.Description className="mt-3 text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
                        {labels["deletion-description"]}
                      </AlertDialog.Description>
                      <dl className="mt-5 grid gap-3 rounded-xl bg-[color:var(--workspace-brand-background)] p-4 text-sm">
                        <div>
                          <dt className="text-[color:var(--workspace-brand-muted)]">
                            {labels["account-summary-label"]}
                          </dt>
                          <dd className="mt-1 break-words font-medium">
                            {aiChatAccount.email}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[color:var(--workspace-brand-muted)]">
                            {labels["project-summary-label"]}
                          </dt>
                          <dd className="mt-1 break-words font-medium">
                            {labels["all-projects-summary"]}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <AlertDialog.Cancel asChild>
                          <Button ref={cancel} variant="secondary">
                            {labels.cancel}
                          </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button
                            variant="danger"
                            onClick={() => setDeletionChecked(true)}
                          >
                            {labels["confirm-delete"]}
                          </Button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </div>
              {deletionChecked && (
                <div className="mt-4">
                  <Feedback>
                    В примере запрос на удаление подтверждён. Данные аккаунта и
                    проектов не удалялись.
                  </Feedback>
                </div>
              )}
            </div>
          </PageSection>

          <details className="rounded-xl border border-[color:var(--workspace-brand-line)] px-5 py-4 text-sm">
            <summary
              className={`w-fit cursor-pointer font-medium ${kit.focus}`}
            >
              {sections.recovery.title}
            </summary>
            <div className="mt-3">
              <SectionText section={sections.recovery} />
            </div>
            <a href={labels["help-href"]} className={`mt-3 ${kit.plain}`}>
              <Icon name="question" />
              {labels["help-label"]}
            </a>
          </details>
        </>
      )}
    </div>
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
