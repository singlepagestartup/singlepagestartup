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
        ru ? "Подготовка скачивания документа" : "Loading document download"
      }
      className="inline-flex"
    >
      <span className="sr-only">
        {ru
          ? "Подготовка скачивания документа…"
          : "Loading document download\u2026"}
      </span>
      <div aria-hidden="true" className="contents motion-safe:animate-pulse">
        <div className="h-11 w-36 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
