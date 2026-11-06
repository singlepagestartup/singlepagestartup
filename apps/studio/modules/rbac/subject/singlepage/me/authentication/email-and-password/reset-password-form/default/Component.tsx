import type {
  IComponentProps,
  ISubjectResetPasswordFormDefaultProps,
} from "./interface";
export type { ISubjectResetPasswordFormDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
} from "react";
import {
  twMerge as mergeButtonClass,
  twMerge as twMerge,
} from "tailwind-merge";
import type IconGlyphs from "../../../../../../../../shared/icon/singlepage/phosphor/icons.json";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

function getStoryLinkProps(href: string, storyHref?: string) {
  if (storyHref) {
    return { href: storyHref, target: "_top" as const };
  }
  return { href };
}
export function Component(props?: IComponentProps) {
  const {
    title,
    description,
    passwordLabel,
    passwordPlaceholder,
    confirmPasswordLabel,
    confirmPasswordPlaceholder,
    submitLabel,
    backLabel,
    backHref,
    backStoryHref,
  } = {
    ...defaultSubjectResetPasswordFormDefaultProps,
    ...props,
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <section
      className="w-full bg-muted py-12 sm:py-16"
      data-ds-block="rbac.subject.me-authentication-email-and-password-reset-password-form-default"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="subject"
      data-variant={
        props?.variant ??
        "me-authentication-email-and-password-reset-password-form-default"
      }
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="px-6 pb-2 pt-8 sm:px-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-muted-foreground"
                htmlFor="rbac-reset-password"
              >
                {passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full rounded-xl border border-border bg-card min-h-12 py-3 pl-12 pr-14 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-border focus:ring-1 focus:ring-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground"
                  id="rbac-reset-password"
                  placeholder={passwordPlaceholder}
                  readOnly
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-muted-foreground"
                htmlFor="rbac-reset-password-confirm"
              >
                {confirmPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="w-full rounded-xl border border-border bg-card min-h-12 py-3 pl-12 pr-14 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-border focus:ring-1 focus:ring-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground"
                  id="rbac-reset-password-confirm"
                  placeholder={confirmPasswordPlaceholder}
                  readOnly
                  type={showConfirmPassword ? "text" : "password"}
                />
                <button
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-11"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  type="button"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button className="w-full" type="button">
              {submitLabel}
            </Button>
          </div>

          <div className="border-t border-border px-6 py-5 text-center sm:px-8">
            <a
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              {...getStoryLinkProps(backHref, backStoryHref)}
            >
              <ArrowLeft className="h-5 w-5" />
              {backLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
const Lock = createIcon("lock-key");
const KeyRound = createIcon("key");
const EyeOff = createIcon("eye-slash");
const Eye = createIcon("eye");
const ArrowLeft = createIcon("arrow-left");
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
export const defaultSubjectResetPasswordFormDefaultProps: ISubjectResetPasswordFormDefaultProps =
  {
    title: "Reset password",
    description: "Enter a new password and confirm it to continue",
    passwordLabel: "New password",
    passwordPlaceholder: "Create a new password",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Repeat your new password",
    submitLabel: "Update Password",
    backLabel: "Back to Sign in",
    backHref: "/rbac/subject/authentication/select-method",
  };
