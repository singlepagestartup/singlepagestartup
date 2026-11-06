import { internationalization } from "@sps/shared-configuration";
import Link from "next/link";
import type { IWorkspaceNoticeProps } from "./interface";
export function Component({
  language = internationalization.defaultLanguage.code,
  state,
  embedded = false,
  message,
  signInHref = `/${language}/ai-chat/sign-in`,
  projectsHref = `/${language}/ai-chat/projects`,
  onRetry,
}: IWorkspaceNoticeProps) {
  const ru = language === "ru";
  const failed = state === "error";
  const needsSignIn = state === "sign-in-required";
  const title = failed
    ? ru
      ? "Не удалось загрузить рабочее пространство."
      : "Couldn't load your workspace."
    : needsSignIn
      ? ru
        ? "Войдите, чтобы открыть рабочее пространство"
        : "Sign in to open your workspace"
      : ru
        ? "Этот проект недоступен в вашем аккаунте."
        : "This project is unavailable in your workspace.";
  const description =
    message ??
    (failed
      ? ru
        ? "Повторите попытку загрузить рабочее пространство."
        : "Try again to reconnect to your workspace."
      : needsSignIn
        ? ru
          ? "Войдите в аккаунт, чтобы открыть свои проекты и обсуждения."
          : "Sign in to your account to access your projects and conversations."
        : ru
          ? "Выберите свой проект или войдите в другой аккаунт."
          : "Choose one of your projects or sign in with a different account.");
  const control =
    "inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground no-underline hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
  const content = (
    <section
      role={failed || state === "access-denied" ? "alert" : "status"}
      data-workspace-state={state}
      className={`w-full grid min-h-[360px] place-items-center rounded-2xl border p-6 sm:p-10 ${failed ? "border-destructive-border bg-destructive-surface" : "border-border bg-card"}`}
    >
      <div className="max-w-md text-center">
        <span
          aria-hidden="true"
          className={`mx-auto mb-6 block h-1 w-10 rounded-full ${failed ? "bg-destructive" : "bg-primary"}`}
        />
        <h1
          className={`text-xl font-semibold sm:text-2xl ${failed ? "text-destructive" : "text-foreground"}`}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {failed ? (
            <button type="button" className={control} onClick={onRetry}>
              {ru ? "Повторить" : "Try again"}
            </button>
          ) : (
            <Link
              href={needsSignIn ? signInHref : projectsHref}
              className={control}
            >
              {needsSignIn
                ? ru
                  ? "Войти"
                  : "Sign in"
                : ru
                  ? "Мои проекты"
                  : "My projects"}
            </Link>
          )}
          {state === "access-denied" && (
            <Link href={signInHref} className={control}>
              {ru ? "Сменить аккаунт" : "Switch account"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
  return embedded ? (
    <div className="flex min-h-0 min-w-0 flex-1 items-center p-4">
      {content}
    </div>
  ) : (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {content}
    </main>
  );
}
