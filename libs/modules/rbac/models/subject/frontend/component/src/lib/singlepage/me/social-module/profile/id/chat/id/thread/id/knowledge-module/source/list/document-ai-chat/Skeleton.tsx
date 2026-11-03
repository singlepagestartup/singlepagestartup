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
        ru ? "Загрузка разделов знаний" : "Loading knowledge sections"
      }
      className="grid gap-4 p-4"
    >
      <span className="sr-only">
        {ru ? "Загрузка разделов знаний…" : "Loading knowledge sections\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
