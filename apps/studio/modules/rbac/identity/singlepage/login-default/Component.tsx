import { Button } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { Checkbox } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Chrome,
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
} from "../../../../../workspace/utils/components/ModuleIcons";
import { useState } from "react";

import { writeRbacStudioAuthUser } from "../../../shared";

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
  submitLabel: "Sign in",
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
  if (icon === "github") return <Github className="h-5 w-5" />;

  return <Chrome className="h-5 w-5" />;
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
    writeRbacStudioAuthUser(email || "sarah@sps.dev");

    if (typeof window === "undefined") return;

    const targetHref = submitStoryHref ?? submitHref;
    const targetWindow = window.top ?? window;

    targetWindow.location.href = targetHref;
  }

  return (
    <section
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="rbac.identity.login-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] shadow-sm">
          <div className="px-6 pb-2 pt-8 sm:px-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]">
              <Lock className="h-5 w-5" />
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
                htmlFor="rbac-login-email"
              >
                {emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-4 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
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
                  className="text-sm font-medium text-[var(--workspace-brand-muted)]"
                  htmlFor="rbac-login-password"
                >
                  {passwordLabel}
                </label>
                <a
                  className="text-xs text-[var(--workspace-brand-muted)] transition hover:text-[var(--workspace-brand-foreground)]"
                  {...getStoryLinkProps(forgotHref, forgotStoryHref)}
                >
                  {forgotLabel}
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                <input
                  className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-14 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
                  id="rbac-login-password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={passwordPlaceholder}
                  type={showPassword ? "text" : "password"}
                  value={password}
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

            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={rememberMe}
                className=""
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span className="text-xs text-[var(--workspace-brand-muted)]">
                {rememberLabel}
              </span>
            </label>

            <Button className="w-full" onClick={handleSubmit} type="button">
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
              {registerPrompt}{" "}
              <a
                className="text-[var(--workspace-brand-foreground)] underline transition hover:text-[var(--workspace-brand-foreground)]"
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
