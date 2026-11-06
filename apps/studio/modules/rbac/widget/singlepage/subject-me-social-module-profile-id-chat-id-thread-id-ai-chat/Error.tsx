import type { IWorkspaceNoticeProps } from "./interface";
export type { IWorkspaceNoticeProps } from "./interface";

export function Component({
  variant = "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  state,
  embedded = false,
  message,
  signInHref = "/ai-chat/rbac/subjects/authentication/select-method",
  projectsHref = "/ai-chat/projects",
  onRetry,
}: IWorkspaceNoticeProps) {
  const failed = state === "error";
  const needsSignIn = state === "sign-in-required";
  const title = failed
    ? "Не удалось загрузить рабочее пространство."
    : needsSignIn
      ? "Войдите, чтобы открыть проект"
      : "Этот проект недоступен в вашем аккаунте.";
  const description =
    message ??
    (failed
      ? "Попробуйте снова подключиться к проекту."
      : needsSignIn
        ? "Войдите в аккаунт, чтобы открыть свои проекты и обсуждения."
        : "Выберите свой проект или войдите в другой аккаунт.");
  const control =
    "inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground no-underline hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
  const content = (
    <section
      role={failed || state === "access-denied" ? "alert" : "status"}
      data-workspace-state={state}
      className={`mx-auto w-full max-w-6xl w-full grid min-h-[360px] place-items-center rounded-2xl border p-6 sm:p-10 ${failed ? "border-destructive-border bg-destructive-surface" : "border-border bg-card"}`}
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
              Попробовать ещё раз
            </button>
          ) : (
            <a
              href={needsSignIn ? signInHref : projectsHref}
              className={control}
            >
              {needsSignIn ? "Войти" : "Мои проекты"}
            </a>
          )}
          {state === "access-denied" && (
            <a href={signInHref} className={control}>
              Сменить аккаунт
            </a>
          )}
        </div>
      </div>
    </section>
  );
  return embedded ? (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
      className="flex min-h-0 min-w-0 flex-1 items-center p-4"
    >
      {content}
    </div>
  ) : (
    <main
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
      className="w-full px-4 py-6 @[800px]:px-8"
    >
      {content}
    </main>
  );
}
