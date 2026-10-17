import { ToastIcon } from "@sps/ui-adapter/toast";
import type { IComponentPropsExtended } from "./interface";
export function Component({ variant = "icons" }: IComponentPropsExtended) {
  return (
    <section
      data-module="shared"
      data-model="toast"
      data-variant={variant}
      className="min-h-screen bg-muted p-6 font-default text-foreground sm:p-10"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Shared / Toast
      </p>
      <h1 className="mt-3 text-2xl font-semibold">Notification icons</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Phosphor Regular, 20 px. Loading animates only when reduced motion is
        disabled. These are the same glyphs used in application notifications.
      </p>
      <div className="mt-8 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(
          [
            "default",
            "success",
            "error",
            "warning",
            "info",
            "loading",
            "close",
          ] as const
        ).map((type) => (
          <div
            key={type}
            className="flex min-h-36 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-5"
          >
            <ToastIcon type={type} />
            <span className="text-sm font-medium capitalize">{type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
