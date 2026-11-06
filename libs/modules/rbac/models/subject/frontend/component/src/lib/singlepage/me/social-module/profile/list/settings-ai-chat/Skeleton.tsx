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
      aria-label={ru ? "Загрузка личного профиля" : "Loading personal profile"}
      className="grid gap-4"
    >
      <span className="sr-only">
        {ru ? "Загрузка личного профиля…" : "Loading personal profile\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-11 w-36 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
