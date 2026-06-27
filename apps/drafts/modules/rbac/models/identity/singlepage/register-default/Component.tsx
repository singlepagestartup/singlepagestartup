import {
  Chrome,
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
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
    loginHref: "/login",
  };

function IdentityProviderIcon({
  icon,
}: {
  icon: IdentityRegisterProvider["icon"];
}) {
  if (icon === "github") return <Github className="h-4 w-4" />;

  return <Chrome className="h-4 w-4" />;
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
      className="w-full py-12"
      data-ds-block="rbac.identity.register-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 pb-6 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">{description}</p>
          </div>

          <div className="space-y-5 px-8 py-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs leading-5 text-blue-700">{demoNote}</p>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-slate-500"
                htmlFor="rbac-register-name"
              >
                {nameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="rbac-register-name"
                  placeholder={namePlaceholder}
                  readOnly
                  type="text"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-slate-500"
                htmlFor="rbac-register-email"
              >
                {emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="rbac-register-email"
                  placeholder={emailPlaceholder}
                  readOnly
                  type="email"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-slate-500"
                htmlFor="rbac-register-password"
              >
                {passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="rbac-register-password"
                  placeholder={passwordPlaceholder}
                  readOnly
                  type={showPassword ? "text" : "password"}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-slate-500"
                htmlFor="rbac-register-confirm"
              >
                {confirmLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  onClick={() => setShowConfirm((value) => !value)}
                  type="button"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2">
              <input
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                readOnly
                type="checkbox"
              />
              <span className="text-xs leading-5 text-slate-600">
                {termsLabel.split("Terms of Service")[0]}
                <a
                  className="text-slate-700 underline hover:text-slate-900"
                  href={termsHref}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  className="text-slate-700 underline hover:text-slate-900"
                  href={privacyHref}
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            <button
              className="flex w-full items-center justify-center rounded-md border border-slate-400 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              type="button"
            >
              {submitLabel}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[10px] uppercase text-slate-400">
                  or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => (
                <button
                  className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                  key={provider.key}
                  type="button"
                >
                  <IdentityProviderIcon icon={provider.icon} />
                  {provider.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 px-8 py-4 text-center">
            <p className="text-xs text-slate-500">
              {loginPrompt}{" "}
              <a
                className="text-slate-700 underline transition hover:text-slate-900"
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
