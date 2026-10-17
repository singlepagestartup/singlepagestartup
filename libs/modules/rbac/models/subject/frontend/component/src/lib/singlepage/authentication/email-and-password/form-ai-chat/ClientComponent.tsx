"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LogIn } from "lucide-react";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";

import type { IComponentProps } from "./interface";

export function Component({ mode }: IComponentProps) {
  const registration = mode === "registration";
  const forgot = mode === "forgot-password";
  const reset = mode === "reset-password";
  const heading = registration
    ? "Create an account"
    : forgot
      ? "Reset your password"
      : reset
        ? "Choose a new password"
        : "Sign in";
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState("");
  const login = subjectApi.authenticationEmailAndPasswordAuthentication({});
  const register = subjectApi.authenticationEmailAndPasswordRegistration({});
  const recover = subjectApi.authenticationEmailAndPasswordForgotPassword({});
  const replace = subjectApi.authenticationEmailAndPasswordResetPassword({});
  const pending =
    login.isPending ||
    register.isPending ||
    recover.isPending ||
    replace.isPending;
  const field =
    "min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base focus:outline-2";
  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h2 className="flex items-center gap-3 text-xl font-semibold">
        <LogIn className="size-5" />
        {heading}
      </h2>
      <form
        className="mt-7 grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setStatus("");
          if ((reset || registration) && password !== confirmation) {
            setStatus("Passwords do not match.");
            return;
          }
          if (
            (registration && !acceptedTerms) ||
            (reset && !search.get("code"))
          )
            return;
          try {
            if (forgot) {
              await recover.mutateAsync({ data: { email } });
              setStatus(
                "If this email is registered, we will send a password reset link.",
              );
              return;
            }
            if (reset) {
              await replace.mutateAsync({
                data: {
                  password,
                  passwordConfirmation: confirmation,
                  code: search.get("code") || "",
                },
              });
              setStatus("Password updated. You can sign in.");
              return;
            }
            await (registration ? register : login).mutateAsync({
              data: { login: email, password },
            });
            router.push(getLocalizedHref(pathname, "/ai-chat/projects"));
            router.refresh();
          } catch (error) {
            setStatus(
              error instanceof Error
                ? error.message
                : "Authentication failed. Please try again.",
            );
          }
        }}
      >
        {!reset && (
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input
              type="email"
              className={field}
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
        )}
        {!forgot && (
          <label className="grid gap-2 text-sm font-semibold">
            Password
            <span className="relative">
              <input
                type={visible ? "text" : "password"}
                className={`${field} pr-12`}
                autoComplete={
                  registration || reset ? "new-password" : "current-password"
                }
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                type="button"
                className="absolute right-1 top-1 flex size-10 items-center justify-center text-muted-foreground"
                onClick={() => setVisible(!visible)}
              >
                {visible ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </span>
          </label>
        )}
        {(reset || registration) && (
          <label className="grid gap-2 text-sm font-semibold">
            Confirm password
            <input
              type="password"
              className={field}
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </label>
        )}
        {!registration && !forgot && !reset && (
          <Link
            className="text-sm underline"
            href={getLocalizedHref(pathname, "/ai-chat/forgot-password")}
          >
            Forgot password?
          </Link>
        )}
        {registration && (
          <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
            <input
              type="checkbox"
              className="mt-1 size-4 appearance-auto accent-foreground"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              required
            />
            <span>
              I agree to the{" "}
              <Link
                href={getLocalizedHref(pathname, "/terms")}
                className="text-foreground underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href={getLocalizedHref(pathname, "/privacy")}
                className="text-foreground underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        )}
        {reset && !search.get("code") && (
          <p role="alert" className="text-sm text-destructive">
            Open the password reset link from your email to continue.
          </p>
        )}
        <button
          disabled={
            pending ||
            ((reset || registration) && password !== confirmation) ||
            (registration && !acceptedTerms) ||
            (reset && !search.get("code"))
          }
          className="flex min-h-11 items-center justify-center gap-3 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold disabled:opacity-50"
        >
          {pending
            ? "Please wait…"
            : forgot
              ? "Send reset link"
              : reset
                ? "Save password"
                : heading}
          <ArrowRight className="size-4" />
        </button>
        {status && (
          <p role="status" className="text-sm leading-6 text-muted-foreground">
            {status}
          </p>
        )}
      </form>
      {forgot || reset ? (
        <Link
          href={getLocalizedHref(pathname, "/ai-chat/sign-in")}
          className="mt-6 block text-center text-sm font-semibold underline"
        >
          Back to sign in
        </Link>
      ) : (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {registration ? "Already have an account? " : "No account yet? "}
          <Link
            className="font-semibold text-foreground underline"
            href={getLocalizedHref(
              pathname,
              registration ? "/ai-chat/sign-in" : "/ai-chat/create-account",
            )}
          >
            {registration ? "Sign in" : "Create an account"}
          </Link>
        </p>
      )}
    </section>
  );
}
