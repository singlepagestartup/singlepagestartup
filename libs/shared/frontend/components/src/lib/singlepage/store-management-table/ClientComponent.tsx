"use client";

import {
  useEffect,
  useId,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { settingsFormStyles } from "@sps/shared-ui-shadcn/form/styles";
import { Button } from "@sps/shared-ui-shadcn/button";
import { Input } from "@sps/shared-ui-shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sps/shared-ui-shadcn/select";
import { Component as Table } from "./Component";
import type { IStoreTableParams, IStoreTableViewProps } from "./interface";

interface IInteractiveProps extends IStoreTableViewProps {
  params: Readonly<IStoreTableParams>;
  setParams: Dispatch<SetStateAction<Readonly<IStoreTableParams>>>;
  total?: number;
  count: number;
  denied: boolean;
  isError: boolean;
  onRetry: () => unknown;
  rows: ReactNode;
}

export function ClientComponent(props: IInteractiveProps) {
  const { params, setParams, total, count } = props;
  const ru = props.language === "ru";
  const titleId = useId();
  const [search, setSearch] = useState(params.search);

  useEffect(() => {
    const value = search.trim();
    if (value === params.search) return;
    const timer = setTimeout(() => {
      setParams((current) => ({ ...current, search: value, offset: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, params.search, setParams]);

  if (props.denied) {
    return (
      <Table
        titleId={titleId}
        title={props.title}
        className={props.className}
        status={<p role="alert">{props.deniedMessage}</p>}
      />
    );
  }

  const searchLabel = props.searchPlaceholder || (ru ? "Поиск" : "Search");
  const range =
    count > 1
      ? `${params.offset + 1}–${params.offset + count}`
      : String(count ? params.offset + 1 : 0);
  const hasNextPage =
    total !== undefined && params.offset + params.limit < total;
  let status: ReactNode;
  if (props.isError) {
    status = (
      <div className="flex flex-wrap items-center gap-3">
        <p role="alert">
          {ru ? "Не удалось загрузить список." : "Could not load the list."}
        </p>
        <Button
          variant="outline"
          type="button"
          className={settingsFormStyles.secondary}
          onClick={() => void props.onRetry()}
        >
          {ru ? "Повторить" : "Retry"}
        </Button>
      </div>
    );
  } else if (total === undefined) {
    status = <p role="status">{ru ? "Загрузка…" : "Loading…"}</p>;
  } else if (!count && !params.offset) {
    status = (
      <p className="text-sm text-muted-foreground">
        {params.search
          ? ru
            ? "Ничего не найдено."
            : "No matches found."
          : props.emptyMessage}
      </p>
    );
  }

  return (
    <Table
      titleId={titleId}
      className={props.className}
      listClassName={props.listClassName}
      title={props.title}
      action={props.action}
      header={props.header}
      status={status}
      rows={count > 0 ? props.rows : null}
      controls={
        <label className="relative block w-full sm:w-80">
          <span className="sr-only">{searchLabel}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            maxLength={180}
            value={search}
            placeholder={searchLabel}
            className={`${settingsFormStyles.field} pl-10`}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      }
      footer={
        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
          <span
            role="status"
            aria-atomic="true"
            className="text-muted-foreground tabular-nums"
          >
            {total === undefined
              ? "—"
              : `${range} ${ru ? "из" : "of"} ${total}`}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span>{ru ? "Строк на странице" : "Rows per page"}</span>
              <Select
                value={String(params.limit)}
                onValueChange={(value) => {
                  const limit = Number(value);
                  setParams((current) => ({ ...current, limit, offset: 0 }));
                }}
              >
                <SelectTrigger
                  aria-label={ru ? "Строк на странице" : "Rows per page"}
                  className="min-h-11 w-auto gap-2 rounded-xl border-border bg-card"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <nav
              aria-label={ru ? "Страницы" : "Pagination"}
              className="flex gap-1"
            >
              <Button
                variant="outline"
                size="icon"
                type="button"
                className={`${settingsFormStyles.secondary} px-2`}
                aria-label={ru ? "Предыдущая страница" : "Previous page"}
                disabled={!params.offset}
                onClick={() =>
                  setParams((current) => ({
                    ...current,
                    offset: Math.max(0, current.offset - current.limit),
                  }))
                }
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                type="button"
                className={`${settingsFormStyles.secondary} px-2`}
                aria-label={ru ? "Следующая страница" : "Next page"}
                disabled={!hasNextPage}
                onClick={() =>
                  setParams((current) => ({
                    ...current,
                    offset: current.offset + current.limit,
                  }))
                }
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </nav>
          </div>
        </footer>
      }
    />
  );
}
