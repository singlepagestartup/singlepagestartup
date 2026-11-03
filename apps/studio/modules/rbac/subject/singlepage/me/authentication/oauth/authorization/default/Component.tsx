"use client";
import type { IComponentProps, IOAuthAuthorizationProps } from "./interface";
export type { IOAuthAuthorizationProps } from "./interface";

import { twMerge as mergeButtonClass } from "tailwind-merge";

import {
  type ButtonHTMLAttributes as ButtonControlProps,
  useEffect,
  useState,
} from "react";

export function Component({
  variant = "me-authentication-oauth-authorization-default",
  initialState = "idle",
  providerName = "Google",
  accountEmail = "preview@example.com",
  onSuccess,
}: IComponentProps = {}) {
  const [state, setState] = useState(initialState);
  useEffect(() => setState(initialState), [initialState]);
  return (
    <section
      aria-label="OAuth authorization"
      className="min-w-0 rounded-2xl border border-border bg-card p-5 text-foreground"
      data-ds-block="rbac.subject.me-authentication-oauth-authorization-default"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <h2 className="text-lg font-semibold">Continue with {providerName}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Choose your provider account and authorize sign-in.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Local preview. No provider is contacted and no access is granted.
      </p>
      <div className="mt-5 grid gap-4">
        {state === "idle" && (
          <Button
            type="button"
            className="w-fit"
            onClick={() => setState("authorize")}
          >
            Continue with {providerName}
          </Button>
        )}
        {state === "authorize" && (
          <>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">
                {providerName} account
              </p>
              <p className="mt-2 break-all text-sm font-medium">
                {accountEmail}
              </p>
              <p className="mt-3 text-sm leading-6">
                Confirm this account to continue to your workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  setState("complete");
                  onSuccess?.();
                }}
              >
                Authorize {providerName}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setState("idle")}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
        {state === "complete" && (
          <p role="status" className="text-sm">
            OAuth authorization completed in this preview.
          </p>
        )}
        {state === "error" && (
          <>
            <p role="alert" className="text-sm text-destructive">
              Authorization was not completed. Try signing in again.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-fit"
              onClick={() => setState("idle")}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
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
