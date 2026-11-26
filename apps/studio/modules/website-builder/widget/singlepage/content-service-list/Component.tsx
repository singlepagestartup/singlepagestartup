import { Component as ContentPageHeader } from "../content-page-header";
import type { IComponentProps } from "./interface";

export function Component({ language = "ru", children }: IComponentProps = {}) {
  const ru = language === "ru";
  return (
    <div
      data-module="website-builder"
      data-model="widget"
      data-variant="content-service-list"
      className="bg-muted pb-12"
    >
      <ContentPageHeader
        variant="content-page-header"
        eyebrow=""
        title={ru ? "Услуги ИИ-агентов" : "AI agent services"}
        description={
          ru
            ? "Выберите, какой результат вам нужен. Материалы и правки обсуждаются в чате заказа."
            : "Choose the deliverable you need. Share materials and request revisions in the order chat."
        }
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </ul>
        ) : (
          <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
            {ru
              ? "Сейчас нет доступных услуг."
              : "No services are available right now."}
          </p>
        )}
      </div>
    </div>
  );
}
