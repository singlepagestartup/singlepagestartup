import type { IWorkspaceSkeletonProps } from "./interface";
export type { IWorkspaceSkeletonProps } from "./interface";

export function Component({
  variant = "subject-me-social-module-profile-id-chat-id-thread-id-ai-chat",
  stage = "checking-session",
  embedded = false,
}: IWorkspaceSkeletonProps) {
  const label =
    stage === "checking-session"
      ? "Checking your session…"
      : stage === "loading-projects"
        ? "Loading your projects…"
        : "Loading your chat…";
  const content = (
    <section
      role="status"
      aria-label={label}
      aria-busy="true"
      data-workspace-state={stage}
      className={
        embedded
          ? "flex min-h-0 min-w-0 flex-1 flex-col"
          : "mx-auto max-w-6xl flex h-[calc(100dvh-9rem)] min-h-[560px] min-w-0 overflow-hidden rounded-2xl border border-border bg-card"
      }
    >
      {!embedded && (
        <aside
          aria-hidden="true"
          className="hidden w-[210px] shrink-0 space-y-7 bg-default p-5 lg:block"
        >
          <div className="h-5 w-36 rounded bg-default-foreground/15 motion-safe:animate-pulse" />
          <div className="space-y-4 rounded-xl bg-default-foreground/5 p-3">
            {["w-full", "w-4/5", "w-3/5"].map((width) => (
              <div
                key={width}
                className={`h-4 ${width} rounded bg-default-foreground/15 motion-safe:animate-pulse`}
              />
            ))}
          </div>
          <div className="h-px bg-default-foreground/10" />
          <div className="h-10 rounded-xl bg-default-foreground/10 motion-safe:animate-pulse" />
        </aside>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-20 items-center gap-3 border-b border-border px-5 py-4">
          <span
            aria-hidden="true"
            className="size-9 shrink-0 rounded-lg bg-border motion-safe:animate-pulse"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <span
              aria-hidden="true"
              className="mt-2 block h-3 w-36 rounded bg-border motion-safe:animate-pulse"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="flex-1 space-y-7 overflow-hidden p-5">
              <MessagePlaceholder />
              <MessagePlaceholder short />
            </div>
            <div className="border-t border-border p-4">
              <div className="flex h-36 flex-col justify-between rounded-2xl border border-border p-4">
                <div className="h-3 w-3/4 rounded bg-border motion-safe:animate-pulse" />
                <div className="flex justify-between">
                  <span className="h-4 w-24 rounded bg-border motion-safe:animate-pulse" />
                  <span className="h-9 w-20 rounded-xl bg-border motion-safe:animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <aside className="hidden space-y-5 border-l border-border bg-muted p-4 lg:block">
            <div className="h-4 w-32 rounded bg-foreground/10 motion-safe:animate-pulse" />
            <div className="space-y-5 rounded-xl border border-border bg-card p-4">
              <div className="h-4 w-2/3 rounded bg-border motion-safe:animate-pulse" />
              <div className="h-44 rounded-xl bg-border motion-safe:animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-lg bg-border motion-safe:animate-pulse" />
                <div className="h-20 rounded-lg bg-border motion-safe:animate-pulse" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
  return embedded ? (
    content
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
function MessagePlaceholder({ short = false }: { short?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="size-9 shrink-0 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="w-full space-y-3 pt-1">
        <div className="h-3 w-24 rounded bg-border motion-safe:animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-border motion-safe:animate-pulse" />
        <div
          className={`h-3 ${short ? "w-1/3" : "w-2/3"} rounded bg-border motion-safe:animate-pulse`}
        />
      </div>
    </div>
  );
}
