import type { IComponentProps } from "./interface";
import { LockKeyhole, CircleCheck } from "lucide-react";
export function Component(props: IComponentProps) {
  const ru = props.language === "ru";
  return (
    <section
      data-module="blog"
      data-model="article"
      data-variant="private-content-default"
      data-access={props.access}
      className="min-w-0 rounded-3xl border border-border bg-card p-6 sm:p-8"
    >
      {props.access === "granted" ? (
        <>
          <p className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CircleCheck className="size-5" aria-hidden="true" />
            {ru ? "Материалы по подписке" : "Subscriber content"}
          </p>
          {props.children}
        </>
      ) : props.access === "checking" ? (
        <div role="status" aria-busy="true" className="space-y-4">
          <p>{ru ? "Проверяем доступ…" : "Checking your access…"}</p>
          <div
            aria-hidden="true"
            className="h-24 rounded-2xl bg-muted motion-safe:animate-pulse"
          />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {ru ? "Материалы по подписке" : "Subscriber content"}
            </p>
            <h2 className="text-2xl font-semibold">
              {props.access === "error"
                ? ru
                  ? "Не удалось проверить доступ"
                  : "Access could not be checked"
                : props.access === "expired"
                  ? ru
                    ? "Продлите подписку"
                    : "Renew your subscription"
                  : ru
                    ? "Продолжите с подпиской"
                    : "Continue with a subscription"}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              {props.access === "error"
                ? ru
                  ? "Попробуйте проверить подписку ещё раз."
                  : "Try checking your subscription again."
                : ru
                  ? "Подписка открывает полную статью и дополнительные материалы."
                  : "A subscription gives you access to the full guide and subscriber resources."}
            </p>
            {props.access === "error" ? (
              <button
                type="button"
                onClick={props.onRetry}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                {ru ? "Повторить" : "Try again"}
              </button>
            ) : (
              <a
                href={props.actionHref}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                {props.access === "guest"
                  ? ru
                    ? "Войти"
                    : "Sign in to continue"
                  : props.access === "expired"
                    ? ru
                      ? "Продлить подписку"
                      : "Renew subscription"
                    : ru
                      ? "Посмотреть подписку"
                      : "View subscription"}
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
