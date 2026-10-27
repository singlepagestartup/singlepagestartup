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
      aria-label={ru ? "Загрузка обсуждения" : "Loading thread"}
      className="grid min-w-0 flex-1 gap-5 p-5"
    >
      <span className="sr-only">
        {ru ? "Загрузка обсуждения…" : "Loading thread\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-8 w-2/3 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="mt-auto h-20 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
