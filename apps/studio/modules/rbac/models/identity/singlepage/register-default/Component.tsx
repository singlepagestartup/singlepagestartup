import { Button } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { Checkbox } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Chrome,
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
  User,
  UserPlus,
} from "../../../../../../workspace/utils/components/ModuleIcons";
import { useState } from "react";

export interface IdentityRegisterProvider {
  key: string;
  label: string;
  icon: "google" | "github";
}

export interface IdentityRegisterDefaultProps {
  title: string;
  description: string;
  demoNote: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmLabel: string;
  confirmPlaceholder: string;
  termsLabel: string;
  termsHref: string;
  privacyHref: string;
  submitLabel: string;
  providers: IdentityRegisterProvider[];
  loginPrompt: string;
  loginLabel: string;
  loginHref: string;
}

export const defaultIdentityRegisterDefaultProps: IdentityRegisterDefaultProps =
  {
    title: "Create an account",
    description: "Get started with your free account today",
    demoNote: "This is a demo. Registration simply creates a local identity.",
    nameLabel: "Full name",
    namePlaceholder: "John Doe",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Min. 6 characters",
    confirmLabel: "Confirm password",
    confirmPlaceholder: "Repeat your password",
    termsLabel: "I agree to the Terms of Service and Privacy Policy",
    termsHref: "/terms",
    privacyHref: "/privacy",
    submitLabel: "Create Account",
    providers: [
      { key: "google", label: "Google", icon: "google" },
      { key: "github", label: "GitHub", icon: "github" },
    ],
    loginPrompt: "Already have an account?",
    loginLabel: "Sign in",
    loginHref: "/rbac/subject/authentication/select-method",
  };

function IdentityProviderIcon({
  icon,
}: {
  icon: IdentityRegisterProvider["icon"];
}) {
  if (icon === "github") return <Github className="h-5 w-5" />;

  return <Chrome className="h-5 w-5" />;
}

export function IdentityRegisterDefault(
  props?: Partial<IdentityRegisterDefaultProps>,
) {
  const {
    title,
    description,
    demoNote,
    nameLabel,
    namePlaceholder,
    emailLabel,
    emailPlaceholder,
    passwordLabel,
    passwordPlaceholder,
    confirmLabel,
    confirmPlaceholder,
    termsLabel,
    termsHref,
    privacyHref,
    submitLabel,
    providers,
    loginPrompt,
    loginLabel,
    loginHref,
  } = {
    ...defaultIdentityRegisterDefaultProps,
    ...props,
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <section
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="rbac.identity.register-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] shadow-sm">
          <div className="px-6 pb-2 pt-8 sm:px-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--workspace-brand-foreground)]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--workspace-brand-muted)]">
              {description}
            </p>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <div className="rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-4 py-3">
              <p className="text-sm leading-6 text-[var(--workspace-brand-foreground)]">
                {demoNote}
              </p>
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-[var(--workspace-brand-muted)]"
                htmlFor="rbac-register-name"
              >
                {nameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-4 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
                  id="rbac-register-name"
                  placeholder={namePlaceholder}
                  readOnly
                  type="text"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-[var(--workspace-brand-muted)]"
                htmlFor="rbac-register-email"
              >
                {emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-4 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
                  id="rbac-register-email"
                  placeholder={emailPlaceholder}
                  readOnly
                  type="email"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-[var(--workspace-brand-muted)]"
                htmlFor="rbac-register-password"
              >
                {passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-14 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
                  id="rbac-register-password"
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
                htmlFor="rbac-register-confirm"
              >
                {confirmLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-14 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
                  id="rbac-register-confirm"
                  placeholder={confirmPlaceholder}
                  readOnly
                  type={showConfirm ? "text" : "password"}
                />
                <button
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--workspace-brand-muted)] transition hover:text-[var(--workspace-brand-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
                  onClick={() => setShowConfirm((value) => !value)}
                  type="button"
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2">
              <Checkbox className="" readOnly />
              <span className="text-sm leading-6 text-[var(--workspace-brand-muted)]">
                {termsLabel.split("Terms of Service")[0]}
                <a
                  className="text-[var(--workspace-brand-foreground)] underline hover:text-[var(--workspace-brand-foreground)]"
                  href={termsHref}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  className="text-[var(--workspace-brand-foreground)] underline hover:text-[var(--workspace-brand-foreground)]"
                  href={privacyHref}
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            <Button className="w-full" type="button">
              {submitLabel}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--workspace-brand-line)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[var(--workspace-brand-surface)] px-3 text-xs text-[var(--workspace-brand-muted)]">
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => (
                <button
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-3 py-2.5 text-sm text-[var(--workspace-brand-foreground)] transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
                  key={provider.key}
                  type="button"
                >
                  <IdentityProviderIcon icon={provider.icon} />
                  {provider.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--workspace-brand-line)] px-6 py-5 text-center sm:px-8">
            <p className="text-xs text-[var(--workspace-brand-muted)]">
              {loginPrompt}{" "}
              <a
                className="text-[var(--workspace-brand-foreground)] underline transition hover:text-[var(--workspace-brand-foreground)]"
                href={loginHref}
              >
                {loginLabel}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
