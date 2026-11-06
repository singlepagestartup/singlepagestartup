import type {
  IComponentProps,
  ISubjectForgotPasswordFormDefaultProps,
} from "./interface";
export type { ISubjectForgotPasswordFormDefaultProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  type ButtonHTMLAttributes as ButtonControlProps,
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
    emailLabel,
    emailPlaceholder,
    submitLabel,
    backLabel,
    backHref,
    backStoryHref,
    sent,
    sentTitle,
    sentDescription,
    sentEmail,
  } = {
    ...defaultSubjectForgotPasswordFormDefaultProps,
    ...props,
  };
  return (
    <section
      className="w-full bg-muted py-12 sm:py-16"
      data-ds-block="rbac.subject.me-authentication-email-and-password-forgot-password-form-default"
      data-ds-layer="singlepage"
      data-module="rbac"
      data-model="subject"
      data-variant={
        props?.variant ??
        "me-authentication-email-and-password-forgot-password-form-default"
      }
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="px-6 pb-2 pt-8 sm:px-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {sent ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-11 w-11 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {sentTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sentDescription}{" "}
                    <strong className="text-foreground">{sentEmail}</strong>
                  </p>
                </div>
                <a
                  className="inline-flex items-center gap-1.5 text-sm text-foreground transition hover:text-foreground"
                  {...getStoryLinkProps(backHref, backStoryHref)}
                >
                  <ArrowLeft className="h-5 w-5" />
                  {backLabel}
                </a>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label
                    className="mb-1.5 block text-sm font-medium text-muted-foreground"
                    htmlFor="rbac-password-reset-email"
                  >
                    {emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="w-full rounded-xl border border-border bg-card min-h-12 py-3 pl-12 pr-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-border focus:ring-1 focus:ring-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground"
                      id="rbac-password-reset-email"
                      placeholder={emailPlaceholder}
                      readOnly
                      type="email"
                    />
                  </div>
                </div>

                <Button className="w-full" type="button">
                  {submitLabel}
                </Button>
              </div>
            )}
          </div>

          {!sent ? (
            <div className="border-t border-border px-6 py-5 text-center sm:px-8">
              <a
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                {...getStoryLinkProps(backHref, backStoryHref)}
              >
                <ArrowLeft className="h-5 w-5" />
                {backLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
const Mail = createIcon("envelope");
const CheckCircle2 = createIcon("check-circle");
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
export const defaultSubjectForgotPasswordFormDefaultProps: ISubjectForgotPasswordFormDefaultProps =
  {
    title: "Forgot password?",
    description: "Enter your email and we will send you a reset link",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submitLabel: "Send Reset Link",
    backLabel: "Back to Sign in",
    backHref: "/rbac/subject/authentication/select-method",
    sent: false,
    sentTitle: "Check your inbox",
    sentDescription: "We sent a password reset link to",
    sentEmail: "sarah@sps.dev",
  };
