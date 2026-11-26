import type { ReactNode } from "react";
import { settingsFormStyles } from "@sps/shared-ui-shadcn/form/styles";
import type { IStoreTableViewProps } from "./interface";

interface ITableLayoutProps extends Pick<
  IStoreTableViewProps,
  "title" | "action" | "className" | "listClassName" | "header"
> {
  titleId: string;
  controls?: ReactNode;
  status?: ReactNode;
  rows?: ReactNode;
  footer?: ReactNode;
}

export function Component(props: ITableLayoutProps) {
  const labelledBy = props.title ? props.titleId : undefined;
  return (
    <section
      aria-labelledby={labelledBy}
      className={`${settingsFormStyles.panel} grid gap-5 ${props.className ?? ""}`}
    >
      {(props.title || props.controls || props.action) && (
        <header className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          {props.title && (
            <h1
              id={props.titleId}
              className="min-w-0 flex-1 text-2xl font-semibold tracking-tight"
            >
              {props.title}
            </h1>
          )}
          {(props.controls || props.action) && (
            <div className="grid min-w-0 gap-3 sm:grid-flow-col sm:auto-cols-auto sm:items-center">
              {props.controls}
              {props.action}
            </div>
          )}
        </header>
      )}
      <div className="min-w-0 max-h-[65dvh] overflow-y-auto">
        {props.header && (
          <div className="sticky top-0 z-10 bg-card py-1">{props.header}</div>
        )}
        {props.status && <div className="py-4">{props.status}</div>}
        {props.rows && (
          <ul
            aria-labelledby={labelledBy}
            className={`pt-2 ${props.listClassName ?? "grid gap-2"}`}
          >
            {props.rows}
          </ul>
        )}
      </div>
      {props.footer}
    </section>
  );
}
