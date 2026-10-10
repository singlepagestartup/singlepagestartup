import { Button } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
} from "../../../../../workspace/utils/components/ModuleIcons";
import { useState } from "react";

export interface IdentityResetPasswordDefaultProps {
  title: string;
  description: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  submitLabel: string;
  backLabel: string;
  backHref: string;
  backStoryHref?: string;
}

export const defaultIdentityResetPasswordDefaultProps: IdentityResetPasswordDefaultProps =
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

function getStoryLinkProps(href: string, storyHref?: string) {
  if (storyHref) {
    return { href: storyHref, target: "_top" as const };
  }

  return { href };
}

export function IdentityResetPasswordDefault(
  props?: Partial<IdentityResetPasswordDefaultProps>,
) {
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
    ...defaultIdentityResetPasswordDefaultProps,
    ...props,
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <section
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="rbac.identity.reset-password-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] shadow-sm">
          <div className="px-6 pb-2 pt-8 sm:px-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--workspace-brand-foreground)]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--workspace-brand-muted)]">
              {description}
            </p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-[var(--workspace-brand-muted)]"
                htmlFor="rbac-reset-password"
              >
                {passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-14 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
                  id="rbac-reset-password"
                  placeholder={passwordPlaceholder}
                  readOnly
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--workspace-brand-muted)] transition hover:text-[var(--workspace-brand-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
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
                className="mb-1.5 block text-sm font-medium text-[var(--workspace-brand-muted)]"
                htmlFor="rbac-reset-password-confirm"
              >
                {confirmPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-14 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
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
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--workspace-brand-muted)] transition hover:text-[var(--workspace-brand-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
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

          <div className="border-t border-[var(--workspace-brand-line)] px-6 py-5 text-center sm:px-8">
            <a
              className="inline-flex items-center gap-1.5 text-xs text-[var(--workspace-brand-muted)] transition hover:text-[var(--workspace-brand-foreground)]"
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
