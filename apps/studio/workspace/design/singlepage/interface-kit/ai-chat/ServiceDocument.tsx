"use client";
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { MarkdownDocument } from "./Markdown";
import { useAIChatProjectHref } from "../../../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import { Button, Icon, kit, SquareImage, type IconName } from "./primitives";
import type {
  IAIChatServicePageContent,
  IWebsiteSection,
} from "../../../../utils/products/ai-chat-content";

interface IServicePageProps {
  copy: IAIChatServicePageContent;
  children: ReactNode;
  showIntro?: boolean;
}

interface IAccountPageProps {
  copy: IAIChatServicePageContent;
  page: "register" | "login";
  children: ReactNode;
}

interface IPageSectionProps {
  section: IWebsiteSection;
  children?: ReactNode;
  icon?: IconName;
  className?: string;
  contentClassName?: string;
  descriptionSize?: "sm" | "xs";
}

interface ISectionTextProps {
  section: IWebsiteSection;
  tone?: "light" | "dark";
  size?: "sm" | "xs";
}

interface ITextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

interface IFeedbackProps {
  children: ReactNode;
  kind?: "success" | "error" | "info";
}

export function ServicePage({
  copy,
  children,
  showIntro = true,
}: IServicePageProps) {
  const projectHref = useAIChatProjectHref();
  return (
    <div
      data-sps-theme="singlepage"
      className="@container min-w-0 bg-sps-grey text-sps-graphite font-sps"
    >
      <main className="mx-auto max-w-6xl px-5 py-7 @[640px]:px-8 @[640px]:py-10">
        <a
          href={copy.labels["back-href"].replace(
            "/ai-chat/projects/example",
            projectHref,
          )}
          className={`mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-sps-muted hover:text-sps-graphite ${kit.focus}`}
        >
          <Icon name="arrow-left" />
          {copy.labels["back-label"]}
        </a>
        {showIntro ? <PageIntro section={copy.sections.hero} /> : null}
        {children}
      </main>
    </div>
  );
}

function PageIntro({ section }: { section: IWebsiteSection }) {
  return (
    <div className="mb-8 max-w-2xl">
      <div className="mb-4 h-1 w-10 rounded-full bg-sps-green" />
      <h1 className="text-3xl font-semibold leading-tight tracking-tight @[640px]:text-4xl">
        {section.title}
      </h1>
      <div className="mt-4">
        <SectionText section={section} />
      </div>
    </div>
  );
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

export function SectionText({
  section,
  tone = "light",
  size = "sm",
}: ISectionTextProps) {
  const projectHref = useAIChatProjectHref();
  return (
    <div
      className={`space-y-3 ${size === "xs" ? "text-xs [&>div]:text-xs [&>div]:leading-relaxed" : "text-sm"} leading-relaxed [&_p]:m-0 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold ${tone === "dark" ? "text-white/80 [&_a]:text-white [&_strong]:text-white" : "text-sps-muted [&_a]:text-sps-graphite [&_strong]:text-sps-graphite"}`}
    >
      {section.paragraphs.map((paragraph, index) => (
        <MarkdownDocument key={index}>
          {paragraph.replaceAll("/ai-chat/projects/example", projectHref)}
        </MarkdownDocument>
      ))}
    </div>
  );
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
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sps-grey">
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

export function TextField({
  label,
  hint,
  error,
  id: suppliedId,
  className = "",
  ...props
}: ITextFieldProps) {
  const generatedId = useId();
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
        <p id={`${id}-error`} className="text-sm text-sps-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label,
  hint,
  error,
  id: suppliedId,
  ...props
}: ITextFieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const [visible, setVisible] = useState(false);
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
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
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
        <p id={`${id}-error`} className="text-sm text-sps-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Feedback({ children, kind = "success" }: IFeedbackProps) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${kind === "error" ? "border-sps-danger-line bg-sps-danger-surface text-sps-danger" : "border-sps-line bg-sps-grey"}`}
    >
      <Icon
        name={
          kind === "error"
            ? "warning"
            : kind === "info"
              ? "question"
              : "check-circle"
        }
        className={kind === "success" ? "text-sps-graphite" : ""}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

interface IServiceDocumentProps {
  eyebrow: string;
  text: string;
}

export function ServiceDocument({ eyebrow, text }: IServiceDocumentProps) {
  return (
    <div
      data-sps-theme="singlepage"
      className="min-h-screen bg-sps-grey text-sps-graphite font-sps"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-sps-line bg-white px-6 py-5">
        <img
          alt="SinglePageStartup"
          className="h-auto w-52 max-w-full"
          src="/workspace-assets/singlepage/generated/living-focus/singlepagestartup-primary-lockup.svg"
        />
        <span className="rounded-full border border-sps-line bg-sps-grey px-3 py-1.5 text-sm font-medium">
          {eyebrow}
        </span>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <article className="min-w-0 rounded-2xl border border-sps-line bg-sps-white p-5 sm:p-8 lg:p-10 [&>div]:text-base [&>div]:text-sps-graphite [&>div_h1]:text-4xl [&>div_h1]:font-semibold [&>div_h1]:leading-tight [&>div_h1]:tracking-normal [&>div_h1]:text-sps-graphite [&>div_h1]:font-sps sm:[&>div_h1]:text-6xl [&>div_h2]:mt-10 [&>div_h2]:text-3xl [&>div_h2]:leading-tight [&>div_h2]:text-sps-graphite [&>div_h2]:font-sps [&>div_h3]:text-lg [&>div_h3]:text-sps-graphite [&>div_a]:text-sps-graphite [&>div_a]:decoration-sps-line [&>div_blockquote]:border-sps-line [&>div_code]:bg-sps-grey [&>div_td]:border-sps-line [&>div_td]:p-3 [&>div_th]:border-sps-line [&>div_th]:bg-sps-grey [&>div_th]:p-3 [&>div_table]:text-sm">
          <MarkdownDocument>{text}</MarkdownDocument>
        </article>
      </main>
    </div>
  );
}

export interface IPanelHeaderProps {
  title: string;
  label: string;
  navigation?: ReactNode;
  actions?: ReactNode;
}
export function PanelHeader({
  title,
  label,
  navigation,
  actions,
}: IPanelHeaderProps) {
  return (
    <header className="sticky top-18 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sps-line bg-sps-white p-4 @[760px]/workspace:top-0">
      <div className="flex min-w-0 items-center gap-3">
        {navigation}
        <div className="min-w-0">
          <p className={`text-xs ${kit.muted}`}>{label}</p>
          <h2 className="mt-1 break-words text-base font-semibold">{title}</h2>
        </div>
      </div>
      {actions}
    </header>
  );
}
