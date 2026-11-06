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
      aria-label={ru ? "Загрузка проектов" : "Loading projects"}
      className="grid gap-4"
    >
      <span className="sr-only">
        {ru ? "Загрузка проектов…" : "Loading projects\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-11 rounded-xl bg-muted" />
        <div className="h-11 rounded-xl bg-muted" />
        <div className="h-11 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
