import type { IComponentProps } from "./interface";
import { internationalization } from "@sps/shared-configuration";
export function Skeleton({
  language = internationalization.defaultLanguage.code,
}: Pick<IComponentProps, "language"> = {}) {
  const ru = language === "ru";
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={
        ru ? "Загрузка профиля помощника" : "Loading assistant profile"
      }
      className="grid gap-5 p-5"
    >
      <span className="sr-only">
        {ru ? "Загрузка профиля помощника…" : "Loading assistant profile\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="size-16 rounded-2xl bg-muted" />
        <div className="h-7 w-2/3 rounded bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
