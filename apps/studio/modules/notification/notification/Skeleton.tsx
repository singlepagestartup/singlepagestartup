import type { ISkeletonProps } from "./interface";
export function Skeleton({
  variant,
  className = "",
  rows = 3,
}: ISkeletonProps) {
  const table = /(?:table|list)/.test(variant ?? "");
  const form = /(?:form|create|update|settings|authentication|checkout)/.test(
    variant ?? "",
  );
  const image = /(?:avatar|image|cover|asset|preview|card|gallery)/.test(
    variant ?? "",
  );
  const conversation =
    false && /ai-chat/.test(variant ?? "") && !table && !form;
  const project =
    false && /ai-chat-project/.test(variant ?? "") && !table && !form;
  const document = false && !table && !form;
  const media = false && !table && !form;
  const count = Number.isFinite(rows)
    ? Math.min(12, Math.max(1, Math.floor(rows)))
    : 3;
  const layout = project
    ? "project"
    : conversation
      ? "conversation"
      : document
        ? "document"
        : image || media
          ? "image"
          : table
            ? "list"
            : form
              ? "form"
              : "card";
  return (
    <section
      role="status"
      aria-busy="true"
      aria-label="Loading notification"
      data-module="notification"
      data-model="notification"
      data-variant={variant}
      data-skeleton-layout={layout}
      className={
        "min-w-0 w-full space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6 " +
        className
      }
    >
      <span className="sr-only">Loading notification…</span>
      <div
        aria-hidden="true"
        data-skeleton-entity="single"
        className="space-y-4"
      >
        <div className="h-5 w-2/5 rounded bg-muted motion-safe:animate-pulse" />
        {project ? (
          <div className="grid min-h-96 gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
            <aside className="hidden space-y-5 rounded-lg bg-muted p-4 lg:block">
              {Array.from({ length: count }, (_, index) => (
                <div
                  key={index}
                  className="h-4 rounded bg-border motion-safe:animate-pulse"
                />
              ))}
            </aside>
            <div className="flex min-w-0 flex-col justify-between gap-8">
              <div className="h-6 w-1/2 rounded bg-muted motion-safe:animate-pulse" />
              <div className="h-52 rounded-xl bg-muted motion-safe:animate-pulse" />
              <div className="h-28 rounded-xl border border-border bg-muted motion-safe:animate-pulse" />
            </div>
          </div>
        ) : conversation ? (
          <div className="flex min-h-96 flex-col justify-between gap-8">
            <div className="space-y-8">
              {Array.from({ length: count }, (_, index) => (
                <div key={index} className="flex gap-3">
                  <div className="size-8 shrink-0 rounded-lg bg-muted motion-safe:animate-pulse" />
                  <div className="w-full space-y-3">
                    <div className="h-3 w-1/4 rounded bg-muted motion-safe:animate-pulse" />
                    <div className="h-14 w-4/5 rounded-xl bg-muted motion-safe:animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-28 rounded-xl border border-border bg-muted motion-safe:animate-pulse" />
          </div>
        ) : document ? (
          <div className="space-y-4">
            <div className="h-40 w-full rounded-xl border border-border bg-muted motion-safe:animate-pulse" />
            <div className="flex gap-3">
              <div className="h-16 w-1/3 rounded-lg bg-muted motion-safe:animate-pulse" />
              <div className="h-16 w-1/3 rounded-lg bg-muted motion-safe:animate-pulse" />
            </div>
          </div>
        ) : image || media ? (
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-xl bg-muted motion-safe:animate-pulse" />
            <div className="h-6 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
            <div className="h-4 w-full rounded bg-muted motion-safe:animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
          </div>
        ) : (
          <div className={table ? "divide-y divide-border" : "space-y-4"}>
            {Array.from({ length: table || form ? count : 1 }, (_, index) => (
              <div
                key={index}
                className={table ? "flex items-center gap-4 py-3" : "space-y-3"}
              >
                <div
                  className={
                    "shrink-0 rounded-lg bg-muted motion-safe:animate-pulse " +
                    (table ? "size-10" : "h-4 w-1/3")
                  }
                />
                <div className="w-full space-y-2">
                  <div className="h-3 w-4/5 rounded bg-muted motion-safe:animate-pulse" />
                  <div className="h-3 w-3/5 rounded bg-muted motion-safe:animate-pulse" />
                </div>
                {form && (
                  <div className="h-10 w-full rounded-lg bg-muted motion-safe:animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
