"use client";
import {
  forwardRef as forwardRef,
  type ReactNode as ReactNode,
  useContext as useContext,
  createContext as createContext,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  twMerge as twMerge,
  twMerge as twMergePresentation,
} from "tailwind-merge";

import Markdown from "markdown-to-jsx";
import { Component as ButtonModel } from "../../../../../button/index";

import IconGlyphs from "../../../../../feature/singlepage/icon/icons.json";
import {
  IWebsiteSection as IWebsiteSection,
  IAIChatServicePageContent as IAIChatServicePageContentPresentation,
  type IAIChatServicePageContent,
} from "../content";

import defaultCopy from "./content.json";

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
      className={twMergePresentation(
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
interface ISelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
interface ISelectProps extends SelectPrimitive.SelectProps {
  id?: string;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  options: ISelectOption[];
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
export interface IHelpProps {
  copy?: IAIChatServicePageContent;
  projectHref?: string;
}
export interface IHelpErrors {
  topic?: string;
  details?: string;
  result?: string;
}
export function Component({
  copy = defaultCopy,
  projectHref,
}: IHelpProps = {}) {
  const { sections, labels } = copy;
  const id = useId();
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState<IHelpErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const topicField = useRef<HTMLButtonElement>(null);
  const detailsField = useRef<HTMLTextAreaElement>(null);
  const resultField = useRef<HTMLTextAreaElement>(null);
  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: IHelpErrors = {};
    if (!topic) nextErrors.topic = labels["topic-error"];
    if (!details.trim()) nextErrors.details = labels["details-error"];
    if (!result.trim()) nextErrors.result = labels["result-error"];
    setErrors(nextErrors);
    if (nextErrors.topic) topicField.current?.focus();
    else if (nextErrors.details) detailsField.current?.focus();
    else if (nextErrors.result) resultField.current?.focus();
    else setSubmitted(true);
  }
  return (
    <ServicePage copy={copy} projectHref={projectHref}>
      <div className="grid min-w-0 items-start gap-6 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PageSection section={sections.request} icon="chat-circle">
          {submitted ? (
            <div className="mt-5 grid gap-5">
              <Feedback kind="success">{labels["success-message"]}</Feedback>
              <SectionText section={sections.success} />
              <dl className="grid gap-5 rounded-xl bg-[color:var(--workspace-brand-background)] p-5">
                {[
                  { label: labels["topic-label"], value: topic },
                  { label: labels["details-label"], value: details },
                  { label: labels["result-label"], value: result },
                ].map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className={kit.label}>{item.label}</dt>
                    <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setSubmitted(false)}>
                  <Icon name="pencil-simple" />
                  {labels["edit-request"]}
                </Button>
                <a
                  href={labels["return-href"].replace(
                    "/ai-chat/social/profiles/example",
                    projectHref ?? "/ai-chat/social/profiles/create",
                  )}
                  className={kit.button}
                >
                  {labels["return-label"]}
                  <Icon name="arrow-right" />
                </a>
              </div>
            </div>
          ) : (
            <form
              className="mt-6 grid gap-5"
              onSubmit={submitRequest}
              noValidate
            >
              <div className="grid gap-2">
                <label htmlFor={`${id}-topic`} className={kit.label}>
                  {labels["topic-label"]}
                </label>
                <Select
                  ref={topicField}
                  id={`${id}-topic`}
                  name="topic"
                  value={topic}
                  onValueChange={(value) => {
                    setTopic(value);
                    setErrors((current) => ({ ...current, topic: undefined }));
                  }}
                  placeholder={labels["topic-placeholder"]}
                  aria-label={labels["topic-label"]}
                  aria-invalid={Boolean(errors.topic)}
                  aria-describedby={
                    errors.topic ? `${id}-topic-error` : undefined
                  }
                  required
                  options={sections.topics.items.map((item) => ({
                    value: item.title,
                    label: item.title,
                  }))}
                />
                {errors.topic && (
                  <p
                    id={`${id}-topic-error`}
                    className="text-sm text-[color:var(--workspace-brand-danger)]"
                    role="alert"
                  >
                    {errors.topic}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor={`${id}-details`} className={kit.label}>
                  {labels["details-label"]}
                </label>
                <textarea
                  ref={detailsField}
                  id={`${id}-details`}
                  name="details"
                  className={`${kit.field} min-h-36 resize-y py-3`}
                  value={details}
                  onChange={(event) => {
                    setDetails(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      details: undefined,
                    }));
                  }}
                  placeholder={labels["details-placeholder"]}
                  required
                  aria-invalid={Boolean(errors.details)}
                  aria-describedby={
                    errors.details ? `${id}-details-error` : undefined
                  }
                />
                {errors.details && (
                  <p
                    id={`${id}-details-error`}
                    className="text-sm text-[color:var(--workspace-brand-danger)]"
                    role="alert"
                  >
                    {errors.details}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor={`${id}-result`} className={kit.label}>
                  {labels["result-label"]}
                </label>
                <textarea
                  ref={resultField}
                  id={`${id}-result`}
                  name="result"
                  className={`${kit.field} min-h-28 resize-y py-3`}
                  value={result}
                  onChange={(event) => {
                    setResult(event.target.value);
                    setErrors((current) => ({ ...current, result: undefined }));
                  }}
                  placeholder={labels["result-placeholder"]}
                  required
                  aria-invalid={Boolean(errors.result)}
                  aria-describedby={
                    errors.result ? `${id}-result-error` : undefined
                  }
                />
                {errors.result && (
                  <p
                    id={`${id}-result-error`}
                    className="text-sm text-[color:var(--workspace-brand-danger)]"
                    role="alert"
                  >
                    {errors.result}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-fit">
                <Icon name="paper-plane-tilt" />
                {labels.submit}
              </Button>
            </form>
          )}
        </PageSection>

        <aside className="min-w-0 rounded-2xl bg-[color:var(--workspace-brand-foreground)] p-6 text-white @3xl:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[color:var(--workspace-brand-accent)]">
            <Icon name="clock" size={24} />
          </div>
          <h2 className="text-2xl font-semibold leading-tight">
            {sections.response.title}
          </h2>
          <div className="mt-4 text-sm leading-6 text-white/80 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_p]:text-white/80">
            <SectionText section={sections.response} tone="dark" />
          </div>
        </aside>
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
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-[color:var(--workspace-brand-foreground)]/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-[color:var(--workspace-brand-muted)]",
  content:
    "z-50 max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-[color:var(--workspace-brand-background)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
};
// shadcn Select composition, themed with module tokens and Phosphor icons.
// https://ui.shadcn.com/docs/components/radix/select
export const Select = forwardRef<HTMLButtonElement, ISelectProps>(
  function Select(
    {
      id,
      className,
      placeholder,
      options,
      "aria-label": ariaLabel,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    return (
      <div className="min-w-0">
        <SelectPrimitive.Root {...props}>
          <SelectPrimitive.Trigger
            ref={ref}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={twMerge(picker.trigger, className)}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <Icon name="caret-down" className={picker.icon} />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          {/* Keep fixed positioning outside CSS containers while retaining the project theme. */}
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              data-workspace-projection="singlepage"
              position="popper"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className={picker.content}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" className="rotate-180" />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={picker.item}
                  >
                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Icon name="check" className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center">
                <Icon name="caret-down" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  },
);
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <ButtonModel {...props} variant="control" appearance={variant} ref={ref} />
  );
});
