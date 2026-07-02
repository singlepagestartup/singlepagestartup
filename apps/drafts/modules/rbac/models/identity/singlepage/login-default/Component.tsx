import { Chrome, Eye, EyeOff, Github, Lock, Mail } from "lucide-react";
import { useState } from "react";

import { writeRbacDraftAuthUser } from "../../../../shared";

export interface IdentityLoginProvider {
  key: string;
  label: string;
  icon: "google" | "github";
}

export interface IdentityLoginDefaultProps {
  title: string;
  description: string;
  demoNote: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberLabel: string;
  forgotLabel: string;
  forgotHref: string;
  forgotStoryHref?: string;
  submitLabel: string;
  submitHref: string;
  submitStoryHref?: string;
  providers: IdentityLoginProvider[];
  registerPrompt: string;
  registerLabel: string;
  registerHref: string;
  registerStoryHref?: string;
}

export const defaultIdentityLoginDefaultProps: IdentityLoginDefaultProps = {
  title: "Welcome back",
  description: "Sign in to your account to continue",
  demoNote:
    "This is a demo. Any email and password will work. Try sarah@sps.dev, james@sps.dev, or marcus@sps.dev.",
  emailLabel: "Email address",
  emailPlaceholder: "you@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "Password",
  rememberLabel: "Remember me for 30 days",
  forgotLabel: "Forgot password?",
  forgotHref: "/rbac/subject/authentication/email-and-password/forgot-password",
  submitLabel: "Sign In",
  submitHref: "/rbac/subject/settings",
  providers: [
    { key: "google", label: "Google", icon: "google" },
    { key: "github", label: "GitHub", icon: "github" },
  ],
  registerPrompt: "Don't have an account?",
  registerLabel: "Sign up for free",
  registerHref: "/rbac/subject/authentication/email-and-password/registration",
};

function getStoryLinkProps(href: string, storyHref?: string) {
  if (storyHref) {
    return {
      href: storyHref,
      target: "_top" as const,
    };
  }

  return { href };
}

function IdentityProviderIcon({
  icon,
}: {
  icon: IdentityLoginProvider["icon"];
}) {
  if (icon === "github") return <Github className="h-4 w-4" />;

  return <Chrome className="h-4 w-4" />;
}

export function IdentityLoginDefault(
  props?: Partial<IdentityLoginDefaultProps>,
) {
  const {
    title,
    description,
    demoNote,
    emailLabel,
    emailPlaceholder,
    passwordLabel,
    passwordPlaceholder,
    rememberLabel,
    forgotLabel,
    forgotHref,
    forgotStoryHref,
    submitLabel,
    submitHref,
    submitStoryHref,
    providers,
    registerPrompt,
    registerLabel,
    registerHref,
    registerStoryHref,
  } = {
    ...defaultIdentityLoginDefaultProps,
    ...props,
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit() {
    writeRbacDraftAuthUser(email || "sarah@sps.dev");

    if (typeof window === "undefined") return;

    const targetHref = submitStoryHref ?? submitHref;
    const targetWindow = window.top ?? window;

    targetWindow.location.href = targetHref;
  }

  return (
    <section
      className="w-full py-12"
      data-ds-block="rbac.identity.login-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 pb-6 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Lock className="h-5 w-5" />
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
                htmlFor="rbac-login-email"
              >
                {emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="rbac-login-email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={emailPlaceholder}
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  className="text-xs font-medium text-slate-500"
                  htmlFor="rbac-login-password"
                >
                  {passwordLabel}
                </label>
                <a
                  className="text-xs text-slate-500 transition hover:text-slate-700"
                  {...getStoryLinkProps(forgotHref, forgotStoryHref)}
                >
                  {forgotLabel}
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  id="rbac-login-password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={passwordPlaceholder}
                  type={showPassword ? "text" : "password"}
                  value={password}
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

            <label className="flex cursor-pointer items-center gap-2">
              <input
                checked={rememberMe}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                onChange={(event) => setRememberMe(event.target.checked)}
                type="checkbox"
              />
              <span className="text-xs text-slate-600">{rememberLabel}</span>
            </label>

            <button
              className="flex w-full items-center justify-center rounded-md border border-slate-400 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              onClick={handleSubmit}
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
              {registerPrompt}{" "}
              <a
                className="text-slate-700 underline transition hover:text-slate-900"
                {...getStoryLinkProps(registerHref, registerStoryHref)}
              >
                {registerLabel}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
