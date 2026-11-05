"use client";
import { memo } from "react";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as WidgetsToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/widgets-to-website-builder-module-widgets/frontend/component";
import type { IClientComponentProps } from "./interface";

export function Component(props: IClientComponentProps) {
  const ru = props.language === "ru";
  const footer = props.failed ? undefined : (
    <nav
      aria-label={ru ? "Страницы статей" : "Article pages"}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        {props.page + 1} / {props.pages} · {props.total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={props.page === 0 || props.fetching}
          onClick={props.onPrevious}
          className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm disabled:opacity-40"
        >
          {ru ? "Назад" : "Previous"}
        </button>
        <button
          type="button"
          disabled={props.page + 1 >= props.pages || props.fetching}
          onClick={props.onNext}
          className="min-h-11 rounded-xl border border-border bg-card px-4 text-sm disabled:opacity-40"
        >
          {ru ? "Далее" : "Next"}
        </button>
      </div>
    </nav>
  );
  const content = props.failed ? (
    <div role="alert" className="col-span-full space-y-3">
      <p>{ru ? "Не удалось загрузить статьи." : "Unable to load articles."}</p>
      <button
        type="button"
        className="min-h-11 rounded-xl border border-border px-4"
        onClick={props.onRetry}
      >
        {ru ? "Повторить" : "Retry"}
      </button>
    </div>
  ) : props.entries.length ? (
    props.entries.map((entry) => (
      <Row
        key={entry.id}
        data={entry}
        language={props.language}
        renderAuthor={props.renderAuthor}
      />
    ))
  ) : (
    <p className="col-span-full text-sm text-muted-foreground">
      {ru ? "Статей пока нет." : "No articles yet."}
    </p>
  );
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={props.className}
    >
      <WidgetsToWebsiteBuilderModuleWidgets
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: props.data.id }],
            },
            orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
          },
        }}
      >
        {({ data }) =>
          data?.map((link) => (
            <WidgetsToWebsiteBuilderModuleWidgets
              key={link.id}
              isServer={false}
              variant="default"
              dataSource="props"
              data={link}
              language={props.language}
              footer={footer}
            >
              {content}
            </WidgetsToWebsiteBuilderModuleWidgets>
          ))
        }
      </WidgetsToWebsiteBuilderModuleWidgets>
    </div>
  );
}
const Row = memo(function Row(props: {
  data: IClientComponentProps["entries"][number];
  language: string;
  renderAuthor?: IClientComponentProps["renderAuthor"];
}) {
  return (
    <Article
      isServer={false}
      variant="default"
      dataSource="props"
      data={props.data}
      language={props.language}
      author={props.renderAuthor?.({ data: props.data, size: "xs" })}
    />
  );
});
