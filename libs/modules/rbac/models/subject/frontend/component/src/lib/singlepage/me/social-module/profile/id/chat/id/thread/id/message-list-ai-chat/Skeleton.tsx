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
      aria-label={ru ? "Загрузка сообщений" : "Loading messages"}
      className="grid gap-6 p-5"
    >
      <span className="sr-only">
        {ru ? "Загрузка сообщений…" : "Loading messages\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="mr-10 h-24 rounded-xl bg-muted" />
        <div className="ml-10 h-32 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
