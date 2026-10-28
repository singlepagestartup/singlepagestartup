"use client";
import {
  forwardRef as forwardRef,
  useState as useStatePresentation,
  forwardRef as forwardRefPresentation,
  type SVGProps as SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

import {
  twMerge as twMerge,
  twMerge as twMergePresentation,
} from "tailwind-merge";

import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";

import IconGlyphs from "../../../../website-builder/feature/singlepage/icon/icons.json";
import type { IAIChatServicePageContent } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";

import { Component as RbacModuleSubject } from "../../../subject/index";
import { useStudioAccount } from "../../../subject/singlepage/account/Account";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
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
function createIcon(name: IconName) {
  const Component = forwardRefPresentation<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMergePresentation("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
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
export interface SubjectMeAccountSettingsProps {
  copy?: IAIChatServicePageContent;
  showTokens?: boolean;
  initialSection?: "profile" | "sign-in" | "purchases" | "data";
}
export function SubjectMeAccountSettings({
  copy,
  showTokens = false,
  initialSection = "profile",
}: SubjectMeAccountSettingsProps = {}) {
  const session = useStudioAccount();
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [signedOut, setSignedOut] = useState(false);
  const id = useId();
  const sections = [
    {
      id: "profile",
      label: "Профиль",
      content: <RbacModuleSubject variant="me-profile-information" />,
    },
    {
      id: "sign-in",
      label: "Способы входа",
      content: <RbacModuleSubject variant="me-identity-find-information" />,
    },
    {
      id: "purchases",
      label: showTokens ? "Токены и покупки" : "Покупки",
      content: (
        <RbacModuleSubject
          variant="account-data"
          copy={copy}
          section="purchases"
          showTokens={showTokens}
        />
      ),
    },
    {
      id: "data",
      label: "Данные и конфиденциальность",
      content: (
        <RbacModuleSubject
          variant="account-data"
          copy={copy}
          section="data"
          showTokens={showTokens}
        />
      ),
    },
  ];
  return (
    <section
      className="w-full bg-[color:var(--workspace-brand-background)] py-6 font-[family-name:var(--workspace-brand-font-body)] text-[color:var(--workspace-brand-foreground)] sm:py-8"
      data-ds-block="rbac.widget.subject-me-account-settings"
      data-ds-imports="rbac.subject.me-profile-information rbac.subject.me-identity-find-information rbac.subject.account-data"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Настройки аккаунта
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--workspace-brand-muted)]">
              Измените профиль, настройте способы входа и посмотрите данные
              аккаунта.
            </p>
          </div>
          <Button
            variant="secondary"
            type="button"
            disabled={signedOut}
            onClick={() => {
              session.signOut();
              setSignedOut(true);
            }}
          >
            <LogOut className="size-4" />
            {signedOut ? "Вы вышли из аккаунта" : "Выйти"}
          </Button>
        </header>
        {signedOut ? (
          <p
            role="status"
            className="rounded-xl border border-[color:var(--workspace-brand-line)] bg-[color:var(--workspace-brand-surface)] p-6"
          >
            Вы вышли из аккаунта.{" "}
            <a
              className="underline"
              href={
                showTokens
                  ? "/ai-chat/rbac/subjects/authentication/select-method"
                  : "/?path=/story/modules-host-models-page-singlepage-rbac-module-subject-me-authentication-select-method--default"
              }
              target={showTokens ? undefined : "_top"}
            >
              Войти снова
            </a>
          </p>
        ) : (
          <div className="grid min-w-0 items-start gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="min-w-0 md:hidden">
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor={`${id}-select`}
              >
                Раздел настроек
              </label>
              <Select
                id={`${id}-select`}
                aria-label="Раздел настроек"
                value={activeSection}
                onValueChange={setActiveSection}
                options={sections.map(({ id, label }) => ({
                  value: id,
                  label,
                }))}
              />
            </div>
            <nav
              aria-label="Настройки"
              className="sticky top-24 hidden space-y-1 md:block"
            >
              {sections.map(({ id: sectionId, label }) => (
                <button
                  key={sectionId}
                  id={`${id}-nav-${sectionId}`}
                  aria-controls={`${id}-panel-${sectionId}`}
                  aria-current={
                    activeSection === sectionId ? "page" : undefined
                  }
                  onClick={() => setActiveSection(sectionId)}
                  type="button"
                  className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--workspace-brand-foreground)] ${activeSection === sectionId ? "bg-[color:var(--workspace-brand-surface)]" : "text-[color:var(--workspace-brand-muted)] hover:bg-[color:var(--workspace-brand-surface)]"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-5 w-1 shrink-0 rounded-full ${activeSection === sectionId ? "bg-[color:var(--workspace-brand-accent)]" : "bg-transparent"}`}
                  />
                  {label}
                </button>
              ))}
            </nav>
            <div className="min-w-0">
              {sections.map(({ id: sectionId, label, content }) => (
                <div
                  key={sectionId}
                  id={`${id}-panel-${sectionId}`}
                  role="region"
                  aria-label={label}
                  hidden={activeSection !== sectionId}
                  className="min-w-0"
                >
                  {content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
const LogOut = createIcon("sign-out");
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-foreground)]";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  button: `${buttonBase} bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-foreground)] enabled:hover:brightness-95 ${focus}`,
  secondary: `${buttonBase} border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] enabled:hover:bg-[var(--workspace-brand-background)] ${focus}`,
  plain: `${buttonBase} text-[var(--workspace-brand-muted)] enabled:hover:text-[var(--workspace-brand-foreground)] ${focus}`,
  danger: `${buttonBase} border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] text-[var(--workspace-brand-danger)] enabled:hover:brightness-95 ${focus}`,
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2 text-base text-[var(--workspace-brand-foreground)] outline-none transition motion-reduce:transition-none placeholder:text-[var(--workspace-brand-muted)] focus-visible:border-[var(--workspace-brand-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--workspace-brand-surface)] disabled:cursor-not-allowed disabled:bg-[var(--workspace-brand-background)] disabled:text-[var(--workspace-brand-muted)] disabled:opacity-60 [&[readonly]]:bg-[var(--workspace-brand-background)] aria-invalid:border-[var(--workspace-brand-danger)] aria-invalid:focus-visible:ring-[var(--workspace-brand-danger)]",
  checkbox:
    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] text-[var(--workspace-brand-foreground)] checked:border-transparent checked:bg-[var(--workspace-brand-accent)] indeterminate:border-transparent indeterminate:bg-[var(--workspace-brand-accent)] disabled:cursor-not-allowed",
  card: "min-w-0 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5",
  muted: "text-[var(--workspace-brand-muted)]",
  label: "text-sm font-semibold text-[var(--workspace-brand-foreground)]",
  focus: focus,
};
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-[var(--workspace-brand-foreground)]/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-[var(--workspace-brand-muted)]",
  content:
    "z-[60] max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] font-[family-name:var(--workspace-brand-font-body)] text-[var(--workspace-brand-foreground)] shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-[var(--workspace-brand-background)] data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
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
    const [projection, setProjection] = useStatePresentation("singlepage");
    const [editorDepth, setEditorDepth] = useStatePresentation(0);
    return (
      <div
        ref={(node) => {
          if (node) {
            setProjection(
              node
                .closest("[data-workspace-projection]")
                ?.getAttribute("data-workspace-projection") ?? "singlepage",
            );
            setEditorDepth(
              Number(
                node
                  .closest("[data-ds-panel-depth]")
                  ?.getAttribute("data-ds-panel-depth") ?? 0,
              ),
            );
          }
        }}
        className="min-w-0"
      >
        <SelectPrimitive.Root
          {...props}
          onValueChange={(value) => {
            // Radix's hidden form select can emit an empty value while newly
            // created options register. Empty values are placeholders, not options.
            if (value) props.onValueChange?.(value);
          }}
        >
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
              data-workspace-projection={projection}
              position="popper"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              className={twMerge(
                picker.content,
                ["z-60", "z-80", "z-[100]", "z-[120]"][
                  Math.min(editorDepth, 3)
                ],
              )}
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
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
export const defaultSubjectMeAccountSettingsProps: SubjectMeAccountSettingsProps =
  { showTokens: false, initialSection: "profile" };
