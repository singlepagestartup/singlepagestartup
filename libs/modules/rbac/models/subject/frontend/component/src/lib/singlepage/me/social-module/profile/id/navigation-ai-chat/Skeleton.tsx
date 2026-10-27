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
        ru ? "Загрузка навигации проекта" : "Loading project navigation"
      }
      className="grid gap-4 p-4"
    >
      <span className="sr-only">
        {ru
          ? "Загрузка навигации проекта…"
          : "Loading project navigation\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-8 w-4/5 rounded bg-muted" />
        <div className="h-7 rounded bg-muted" />
        <div className="h-7 rounded bg-muted" />
        <div className="h-7 rounded bg-muted" />
      </div>
    </div>
  );
}
