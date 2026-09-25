import { ArrowLeft, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
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
    backLabel: "Back to Sign In",
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
      className="w-full py-12"
      data-ds-block="rbac.identity.reset-password-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 pb-6 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">{description}</p>
          </div>

          <div className="space-y-5 px-8 py-6">
            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-slate-500"
                htmlFor="rbac-reset-password"
              >
                {passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="rbac-reset-password"
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
                htmlFor="rbac-reset-password-confirm"
              >
                {confirmPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  type="button"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center rounded-md border border-slate-400 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              type="button"
            >
              {submitLabel}
            </button>
          </div>

          <div className="border-t border-slate-100 px-8 py-4 text-center">
            <a
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700"
              {...getStoryLinkProps(backHref, backStoryHref)}
            >
              <ArrowLeft className="h-3 w-3" />
              {backLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
