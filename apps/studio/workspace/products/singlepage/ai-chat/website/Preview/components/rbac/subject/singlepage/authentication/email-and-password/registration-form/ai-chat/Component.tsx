"use client";
import {
  type ReactNode as ReactNode,
  createContext as createContext,
  useContext as useContext,
  type ImgHTMLAttributes as ImgHTMLAttributes,
  type InputHTMLAttributes as InputHTMLAttributes,
  useId as useIdPresentation,
  useState as useStatePresentation,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
  type FormEvent,
} from "react";

import {
  twMerge as twMerge,
  twMerge as twMergePresentation,
} from "tailwind-merge";
import Markdown from "markdown-to-jsx";

import { Component as WebsiteBuilderModuleButton } from "../../../../../../../website-builder/button/index";

import IconGlyphs from "../../../../../../../website-builder/feature/singlepage/icon/icons.json";
import {
  IAIChatServicePageContent as IAIChatServicePageContentPresentation,
  IWebsiteSection as IWebsiteSection,
  type IAIChatServicePageContent,
} from "../../../../../../../website-builder/widget/singlepage/content/ai-chat/content";

import defaultCopy from "./content.json";

function TextField({
  label,
  hint,
  error,
  id: suppliedId,
  className = "",
  ...props
}: ITextFieldProps) {
  const generatedId = useIdPresentation();
  const id = suppliedId ?? generatedId;
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className={`block ${kit.label}`}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`${kit.field} ${className}`}
      />
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs leading-relaxed ${kit.muted}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-sm text-[color:var(--workspace-brand-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
interface ITextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}
function PasswordField({
  label,
  hint,
  error,
  id: suppliedId,
  ...props
}: ITextFieldProps) {
  const generatedId = useIdPresentation();
  const id = suppliedId ?? generatedId;
  const [visible, setVisible] = useStatePresentation(false);
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className={`block ${kit.label}`}>
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={`${kit.field} pr-14`}
        />
        <Button
          variant="plain"
          onClick={() => setVisible(!visible)}
          aria-label={`${visible ? "Скрыть" : "Показать"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute top-0.5 right-1 min-h-11 w-11 px-2"
        >
          <Icon name={visible ? "eye-slash" : "eye"} />
        </Button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs leading-relaxed ${kit.muted}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-sm text-[color:var(--workspace-brand-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
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
export function PageSection({
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
interface ISquareImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
}
function SquareImage({
  alt,
  className,
  loading = "lazy",
  ...props
}: ISquareImageProps) {
  return (
    <img
      alt={alt}
      loading={loading}
      className={twMergePresentation(
        "block aspect-square w-full object-cover",
        className,
      )}
      {...props}
    />
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
          <a
            href={copy.labels["back-href"].replace(
              "/ai-chat/social/profiles/example",
              projectHref,
            )}
            className={`mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[color:var(--workspace-brand-muted)] hover:text-[color:var(--workspace-brand-foreground)] ${kit.focus}`}
          >
            <Icon name="arrow-left" />
            {copy.labels["back-label"]}
          </a>
          {showIntro ? <PageIntro section={copy.sections.hero} /> : null}
          {children}
        </main>
      </div>
    </ProjectHrefContext.Provider>
  );
}
interface IAccountPageProps {
  copy: IAIChatServicePageContentPresentation;
  page: "register" | "login";
  children: ReactNode;
}
export function AccountPage({ copy, page, children }: IAccountPageProps) {
  const secondaryPhoto = copy.labels["secondary-photo-src"];
  return (
    <ServicePage copy={copy} showIntro={false}>
      <div
        className={`grid min-w-0 items-stretch gap-8 @[1000px]:gap-12 ${secondaryPhoto ? "@[760px]:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]" : "@[760px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]"}`}
      >
        <div className={`min-w-0 ${secondaryPhoto ? "flex flex-col" : ""}`}>
          <PageIntro section={copy.sections.hero} />
          {children}
        </div>
        <aside
          className={`min-w-0 flex flex-col ${secondaryPhoto ? "justify-between gap-6" : ""}`}
        >
          {secondaryPhoto ? (
            <SquareImage
              src={copy.labels["photo-src"]}
              alt={copy.labels["photo-alt"]}
              data-asset-id={copy.labels["photo-asset-id"]}
              width={1254}
              height={1254}
              loading="eager"
              className="rounded-2xl"
            />
          ) : null}
          <div
            className={
              page === "login"
                ? "relative flex min-h-128 min-w-0 flex-1 items-end overflow-hidden rounded-2xl @[760px]:min-h-0"
                : "min-w-0"
            }
          >
            <SquareImage
              src={secondaryPhoto || copy.labels["photo-src"]}
              alt={
                secondaryPhoto
                  ? copy.labels["secondary-photo-alt"]
                  : copy.labels["photo-alt"]
              }
              data-asset-id={
                secondaryPhoto
                  ? copy.labels["secondary-photo-asset-id"]
                  : copy.labels["photo-asset-id"]
              }
              width={1254}
              height={1254}
              loading={secondaryPhoto ? "lazy" : "eager"}
              className={
                page === "login"
                  ? "absolute inset-0 h-full w-full aspect-auto"
                  : "rounded-2xl"
              }
            />
            <div
              className={`relative z-10 mx-4 @[640px]:mx-5 ${page === "login" ? "my-4 flex-1 @[640px]:my-5" : "-mt-16"}`}
            >
              <PageSection
                section={
                  page === "register"
                    ? copy.sections.materials
                    : copy.sections.recovery
                }
                icon={page === "register" ? "shield-check" : "question"}
                className="shadow-lg shadow-black/5"
              />
            </div>
          </div>
        </aside>
      </div>
    </ServicePage>
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
export interface IRegisterProps {
  copy?: IAIChatServicePageContent;
}
export interface IRegisterErrors {
  email?: string;
  password?: string;
  repeatedPassword?: string;
}
export function Component({ copy = defaultCopy }: IRegisterProps = {}) {
  const label = copy.labels;
  const id = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [errors, setErrors] = useState<IRegisterErrors>({});
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email");
    const nextErrors: IRegisterErrors = {};
    if (
      !email.trim() ||
      (input instanceof HTMLInputElement && input.validity.typeMismatch)
    ) {
      nextErrors.email = label["email-error"];
    }
    if (!password) nextErrors.password = label["password-error"];
    if (!repeatedPassword || repeatedPassword !== password) {
      nextErrors.repeatedPassword = label["repeat-password-error"];
    }
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      const field = event.currentTarget.elements.namedItem(firstError);
      if (field instanceof HTMLElement) field.focus();
    }
    setSubmitted(Object.keys(nextErrors).length === 0);
  }
  return (
    <AccountPage copy={copy} page="register">
      <PageSection
        section={copy.sections.account}
        icon="user-plus"
        descriptionSize="xs"
      >
        <form noValidate onSubmit={submit} className="grid content-start gap-5">
          <TextField
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            label={label["email-label"]}
            placeholder={label["email-placeholder"]}
            value={email}
            error={errors.email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
              setSubmitted(false);
            }}
          />
          <PasswordField
            id={`${id}-password`}
            name="password"
            autoComplete="new-password"
            required
            label={label["password-label"]}
            value={password}
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
              setSubmitted(false);
            }}
          />
          <PasswordField
            id={`${id}-repeat-password`}
            name="repeatedPassword"
            autoComplete="new-password"
            required
            label={label["repeat-password-label"]}
            value={repeatedPassword}
            error={errors.repeatedPassword}
            onChange={(event) => {
              setRepeatedPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                repeatedPassword: undefined,
              }));
              setSubmitted(false);
            }}
          />
          <a
            className={`w-fit text-sm leading-6 underline decoration-[color:var(--workspace-brand-line)] underline-offset-4 ${kit.focus}`}
            href={label["terms-href"]}
          >
            {label["terms-label"]}
          </a>
          <Button type="submit" className="w-full justify-center">
            {label.submit}
            <Icon name="arrow-right" />
          </Button>
          <p className="text-center text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
            {label["existing-account"]}{" "}
            <a
              className={`font-semibold text-[color:var(--workspace-brand-foreground)] underline underline-offset-4 ${kit.focus}`}
              href={label["sign-in-href"]}
            >
              {label["sign-in-label"]}
            </a>
          </p>
        </form>
        {submitted ? (
          <div className="mt-6 grid gap-4">
            <Feedback kind="success">{label["success-message"]}</Feedback>
            <p className="text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
              {copy.sections.success.paragraphs.join(" ")}
            </p>
            <a
              className={`${kit.secondary} w-fit`}
              href={label["continue-href"]}
            >
              {label["continue-label"]}
              <Icon name="arrow-right" />
            </a>
          </div>
        ) : null}
      </PageSection>
    </AccountPage>
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
