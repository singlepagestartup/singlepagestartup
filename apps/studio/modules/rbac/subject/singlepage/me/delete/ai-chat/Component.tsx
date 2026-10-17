"use client";
import type { IComponentProps, ISettingsProps } from "./interface";
export type { ISettingsProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../shared/icon";

import {
  type ReactNode,
  useContext,
  createContext,
  type ButtonHTMLAttributes as ButtonControlProps,
  useRef,
  useState,
} from "react";
import {
  twMerge as mergeButtonClass,
  twMerge as twMerge,
} from "tailwind-merge";
import Markdown from "markdown-to-jsx";
import type IconGlyphs from "../../../../../../shared/icon/singlepage/phosphor/icons.json";
import {
  IWebsiteSection,
  type IAIChatServicePageContent,
} from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import defaultCopy from "./content.json";
import { useAIChatAccount } from "../../account/Account";
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
  variant = "me-delete-ai-chat",
  copy = defaultCopy,
}: IComponentProps = {}) {
  const aiChatAccount = useAIChatAccount();
  const { sections, labels } = copy;
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deletionChecked, setDeletionChecked] = useState(false);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  return (
    <div
      data-ds-block="rbac.subject.me-delete-ai-chat"
      className="grid min-w-0 gap-5"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <PageSection section={sections.privacy} icon="shield">
        <div className="mt-6 border-t border-destructive-border pt-6">
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
                  className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 font-default text-foreground shadow-xl"
                  onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    cancel.current?.focus();
                  }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive-surface text-destructive">
                    <Icon name="trash" size={24} />
                  </div>
                  <AlertDialog.Title className="text-2xl font-semibold leading-tight">
                    {labels["deletion-title"]}
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
                    {labels["deletion-description"]}
                  </AlertDialog.Description>
                  <dl className="mt-5 grid gap-3 rounded-xl bg-muted p-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">
                        {labels["account-summary-label"]}
                      </dt>
                      <dd className="mt-1 break-words font-medium">
                        {aiChatAccount.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
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
                Deletion request confirmed in this preview. No account or
                project data was deleted.
              </Feedback>
            </div>
          )}
        </div>
      </PageSection>

      <details className="rounded-xl border border-border px-5 py-4 text-sm">
        <summary className={`w-fit cursor-pointer font-medium ${kit.focus}`}>
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
    </div>
  );
}
const ProjectHrefContext = createContext("/ai-chat/social/profiles/create");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-primary text-primary-foreground enabled:hover:brightness-95 ${focus}`,
  plain: `${buttonBase} text-muted-foreground enabled:hover:text-foreground ${focus}`,
  card: "min-w-0 rounded-2xl border border-border bg-card p-5",
  focus: focus,
};
function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ButtonControlProps<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "plain" | "danger";
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const appearances = {
    primary: "bg-primary text-primary-foreground enabled:hover:brightness-95",
    secondary:
      "border border-border bg-card text-foreground enabled:hover:bg-muted",
    plain: "text-muted-foreground enabled:hover:text-foreground",
    danger:
      "border border-destructive-border bg-destructive-surface text-destructive enabled:hover:brightness-95",
  };
  return (
    <button
      {...props}
      type={type}
      className={mergeButtonClass(
        "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        appearances[variant],
        className,
      )}
    />
  );
}
