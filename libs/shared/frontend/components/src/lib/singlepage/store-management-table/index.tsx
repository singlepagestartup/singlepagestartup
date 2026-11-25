import { Suspense } from "react";
import { ErrorBoundary } from "@sps/ui-adapter";
import { Component as Client } from "./client";
import { Component as Server } from "./server";
import type { IComponentProps } from "./interface";

export function Component<T>(props: IComponentProps<T>) {
  const { Provider, language } = props;
  const reader =
    props.isServer === true ? (
      <Server readPage={props.readPage} renderClient={props.renderClient} />
    ) : (
      <Client
        language={language}
        title={props.title}
        action={props.action}
        header={props.header}
        searchPlaceholder={props.searchPlaceholder}
        emptyMessage={props.emptyMessage}
        deniedMessage={props.deniedMessage}
        className={props.className}
        listClassName={props.listClassName}
        initialData={props.initialData}
        usePage={props.usePage}
        renderRow={props.renderRow}
      />
    );

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <p role="status">{language === "ru" ? "Загрузка…" : "Loading…"}</p>
        }
      >
        {Provider ? <Provider>{reader}</Provider> : reader}
      </Suspense>
    </ErrorBoundary>
  );
}
