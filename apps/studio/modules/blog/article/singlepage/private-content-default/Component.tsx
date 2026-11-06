import type { IComponentProps } from "./interface";
import { Component as SharedIcon } from "../../../../shared/icon";
export function Component({
  access = "locked",
  title = "Continue with a subscription",
  description = "Get access to the full guide, examples and subscriber resources.",
  actionHref = "/ecommerce/products",
  actionLabel,
  actionTarget,
  children,
}: IComponentProps) {
  return (
    <section
      data-module="blog"
      data-model="article"
      data-variant="private-content-default"
      data-access={access}
      data-ds-block="blog.article.private-content-default"
      data-ds-layer="singlepage"
      className="min-w-0 rounded-3xl border border-border bg-card p-6 sm:p-8"
    >
      {access === "granted" ? (
        <>
          <p className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <SharedIcon variant="phosphor" name="check-circle" /> Subscriber
            content
          </p>
          {children ?? <p>Your subscriber resources are ready.</p>}
        </>
      ) : access === "checking" ? (
        <div role="status" aria-busy="true" className="space-y-4">
          <p>Checking your access…</p>
          <div
            aria-hidden="true"
            className="h-24 rounded-2xl bg-muted motion-safe:animate-pulse"
          />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <SharedIcon variant="phosphor" name="lock-key" />
          </span>
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subscriber content
            </p>
            <h2 className="text-2xl font-semibold">
              {access === "error"
                ? "Access could not be checked"
                : access === "expired"
                  ? "Renew your subscription"
                  : title}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              {access === "error"
                ? "Try again to check your subscription."
                : description}
            </p>
            <a
              href={actionHref}
              target={actionTarget}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {actionLabel ??
                (access === "guest"
                  ? "Sign in to continue"
                  : access === "expired"
                    ? "Renew subscription"
                    : access === "error"
                      ? "Try again"
                      : "View subscription")}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
