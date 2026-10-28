import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <div
      role="status"
      aria-label="Loading article"
      data-module="blog"
      data-model="article"
      data-variant="loading"
      className={
        "min-w-0 overflow-hidden rounded-2xl border border-border bg-card " +
        (props.className ?? "")
      }
    >
      <div
        aria-hidden="true"
        className="aspect-square bg-muted motion-safe:animate-pulse"
      />
      <div aria-hidden="true" className="space-y-3 p-5">
        <div className="h-6 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
        <div className="h-4 rounded bg-muted motion-safe:animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-muted motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
