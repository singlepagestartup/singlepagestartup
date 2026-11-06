"use client";
import type {
  IComponentProps,
  SubjectMeProfileSettingsProps,
} from "./interface";
export type { SubjectMeProfileSettingsProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  useState as useStatePresentation,
  forwardRef as forwardRefPresentation,
  type SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useId,
  useState,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { twMerge, twMerge as twMergePresentation } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
import type { IAIChatServicePageContent } from "../../../../website-builder/widget/singlepage/content/ai-chat/content";
import { Component as Subject } from "../../../subject/index";
import { useStudioAccount } from "../../../subject/singlepage/me/account/Account";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
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
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function SubjectMeProfileSettings({
  variant = "subject-me-profile-settings",
  copy,
  showTokens = false,
  initialSection = "profile",
  profileId,
}: IComponentProps = {}) {
  const session = useStudioAccount();
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [signedOut, setSignedOut] = useState(false);
  const id = useId();
  const sections = [
    {
      id: "profile",
      label: "Профиль",
      content: (
        <Subject
          variant="me-social-module-profile-id-settings-ai-chat"
          profileId={profileId ?? session.account.profile?.id}
        />
      ),
    },
    {
      id: "sign-in",
      label: "Способы входа",
      content: <Subject variant="me-identity-find-information" />,
    },
    {
      id: "purchases",
      label: showTokens ? "Токены и покупки" : "Покупки",
      content: (
        <Subject
          variant="me-ecommerce-module-order-list-ai-chat"
          copy={copy}
          showTokens={showTokens}
        />
      ),
    },
    {
      id: "data",
      label: "Данные и конфиденциальность",
      content: <Subject variant="me-delete-ai-chat" copy={copy} />,
    },
  ];
  return (
    <section
      className="w-full bg-muted py-6 font-default text-foreground sm:py-8"
      data-ds-block="rbac.widget.subject-me-profile-settings"
      data-ds-imports="rbac.subject.me-social-module-profile-id-settings-ai-chat rbac.subject.me-identity-find-information rbac.subject.me-ecommerce-module-order-list-ai-chat rbac.subject.me-delete-ai-chat"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Настройки аккаунта
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
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
            className="rounded-xl border border-border bg-card p-6"
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
                  className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${activeSection === sectionId ? "bg-card" : "text-muted-foreground hover:bg-card"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-5 w-1 shrink-0 rounded-full ${activeSection === sectionId ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
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
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const buttonBase =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition motion-reduce:transition-none enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
const kit = {
  field:
    "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition motion-reduce:transition-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 [&[readonly]]:bg-muted aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
};
const picker = {
  trigger: `${kit.field} flex h-12 items-center justify-between gap-3 rounded-lg text-left text-sm font-normal shadow-sm focus-visible:ring-[3px] focus-visible:ring-foreground/20 focus-visible:ring-offset-0 [&>span]:truncate`,
  icon: "pointer-events-none text-muted-foreground",
  content:
    "z-[60] max-h-[var(--radix-select-content-available-height)] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-card font-default text-foreground shadow-md",
  item: "relative flex min-h-9 w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
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
                .closest("[data-sps-theme]")
                ?.getAttribute("data-sps-theme") ?? "singlepage",
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
              data-sps-theme={projection}
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
export const defaultSubjectMeProfileSettingsProps: SubjectMeProfileSettingsProps =
  {
    showTokens: false,
    initialSection: "profile",
  };
