"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceStoreListItem } from "@sps/rbac/models/subject/sdk/model";
import { ChevronRight, Plus, Store } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { primaryClass, secondaryClass, storeList } from "./primitives";
import { storeHref, workspaceHref } from "./view-model";

interface IStoresProps {
  language: string;
  subjectId: string;
}

interface IStoreRowProps {
  language: string;
  store: ICrmWorkspaceStoreListItem;
}

const columns =
  "sm:grid-cols-[minmax(0,3fr)_minmax(5rem,1fr)_minmax(6rem,1fr)_1rem]";

const StoreRow = memo(function StoreRow({ store, language }: IStoreRowProps) {
  const ru = language === "ru";
  const productsId = `store-products-${store.id}`;
  const employeesId = `store-employees-${store.id}`;

  return (
    <li>
      <Link
        href={storeHref(language, store.slug)}
        aria-label={store.title}
        aria-describedby={`${productsId} ${employeesId}`}
        className={`${storeList.row} ${columns} grid grid-cols-[auto_minmax(0,1fr)_1rem] items-center gap-x-4 gap-y-2 px-4 py-3 text-sm`}
      >
        <span className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
            <Store aria-hidden="true" className="size-5" />
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="wrap-anywhere font-semibold">{store.title}</span>
            <span className="wrap-anywhere text-xs text-muted-foreground">
              {store.slug}
            </span>
          </span>
        </span>
        <span
          id={productsId}
          className="col-start-1 row-start-2 text-xs tabular-nums sm:col-start-2 sm:row-start-1 sm:text-sm"
        >
          <span className="text-muted-foreground sm:sr-only">
            {ru ? "Товары" : "Products"}{" "}
          </span>
          {store.productCount ?? "—"}
        </span>
        <span
          id={employeesId}
          className="col-start-2 row-start-2 text-xs tabular-nums sm:col-start-3 sm:row-start-1 sm:text-sm"
        >
          <span className="text-muted-foreground sm:sr-only">
            {ru ? "Сотрудники" : "Employees"}{" "}
          </span>
          {store.employeeCount ?? "—"}
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`${storeList.arrow} col-start-3 row-start-1 sm:col-start-4`}
        />
      </Link>
    </li>
  );
});

export function Stores({ language, subjectId }: IStoresProps) {
  const ru = language === "ru";
  const stores = api.crmWorkspace.useStores(subjectId);

  return (
    <section
      className={storeList.panel}
      aria-labelledby="workspace-stores-title"
    >
      <header className={storeList.heading}>
        <h1 id="workspace-stores-title" className={storeList.title}>
          {ru ? "Мои магазины" : "My stores"}
        </h1>
        <Link href={`${workspaceHref(language)}/new`} className={primaryClass}>
          <Plus aria-hidden="true" className="size-4" />
          {ru ? "Создать магазин" : "Create store"}
        </Link>
      </header>
      {stores.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          {ru ? "Загружаем магазины…" : "Loading stores…"}
        </p>
      )}
      {stores.isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            {ru ? "Не удалось загрузить магазины." : "Could not load stores."}
          </span>
          <button
            type="button"
            className={secondaryClass}
            onClick={() => void stores.refetch()}
          >
            {ru ? "Повторить" : "Retry"}
          </button>
        </div>
      )}
      {stores.isSuccess &&
        (stores.data.length ? (
          <div className="grid min-w-0 gap-2">
            <div
              aria-hidden="true"
              className={`${columns} hidden items-center gap-x-4 px-4 text-xs font-medium text-muted-foreground sm:grid`}
            >
              <span>{ru ? "Магазин" : "Store"}</span>
              <span>{ru ? "Товары" : "Products"}</span>
              <span>{ru ? "Сотрудники" : "Employees"}</span>
            </div>
            <ul className="grid gap-2" aria-labelledby="workspace-stores-title">
              {stores.data.map((store) => (
                <StoreRow key={store.id} store={store} language={language} />
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {ru
              ? "У вас пока нет магазинов."
              : "You do not have any stores yet."}
          </p>
        ))}
    </section>
  );
}
