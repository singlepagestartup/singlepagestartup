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
      aria-label={ru ? "Загрузка аватара" : "Loading avatar"}
      className="mt-6 flex items-center gap-4"
    >
      <span className="sr-only">
        {ru ? "Загрузка аватара…" : "Loading avatar\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="size-20 rounded-2xl bg-muted" />
        <div className="h-11 w-36 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
