"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceStore } from "@sps/rbac/models/subject/sdk/model";
import type { ReactNode } from "react";
import { secondaryClass } from "../../../../subject-me-crm-module-store-workspace/primitives";
import { hasStatus } from "../../../../subject-me-crm-module-store-workspace/view-model";

import { StoreHeader } from "../../ecommerce-module/store/StoreHeader";

export interface IFunnelStoreScope {
  subjectId: string;
  store: ICrmWorkspaceStore;
}

interface IStoreScopeProps {
  widgetId: string;
  ecommerceModuleStoreSlug: string;
  language: string;
  children: (scope: IFunnelStoreScope) => ReactNode;
}

interface IStoreForSubjectProps extends IStoreScopeProps {
  subjectId: string;
}

interface IFunnelErrorProps {
  language: string;
  message: string;
  retry?: () => void;
}

export function FunnelError({ language, message, retry }: IFunnelErrorProps) {
  return (
    <div
      role="alert"
      className="grid gap-3 rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
    >
      <p>{message}</p>
      {retry && (
        <button
          type="button"
          className={`${secondaryClass} w-fit`}
          onClick={retry}
        >
          {language === "ru" ? "Повторить" : "Retry"}
        </button>
      )}
    </div>
  );
}

function StoreForSubject({
  widgetId,
  subjectId,
  ecommerceModuleStoreSlug,
  language,
  children,
}: IStoreForSubjectProps) {
  const stores = api.crmWorkspace.useStores(
    subjectId,
    ecommerceModuleStoreSlug,
  );
  const ru = language === "ru";
  const store = stores.data?.find(
    ({ slug }) => slug === ecommerceModuleStoreSlug,
  );

  if (hasStatus(stores.error, 401, 403) || (stores.data && !store)) {
    return (
      <FunnelError
        language={language}
        message={
          ru
            ? "Нет доступа к воронкам этого магазина."
            : "You do not have access to this store's funnels."
        }
      />
    );
  }
  if (!stores.data && stores.isError) {
    return (
      <FunnelError
        language={language}
        message={
          ru ? "Не удалось загрузить магазин." : "Could not load the store."
        }
        retry={() => void stores.refetch()}
      />
    );
  }
  if (!store) {
    return <p role="status">{ru ? "Загружаем магазин…" : "Loading store…"}</p>;
  }
  return (
    <>
      <StoreHeader
        language={language}
        storeSlug={store.slug}
        widgetId={widgetId}
        storeId={store.id}
        section="funnels"
        access={store}
      />
      {children({ subjectId, store })}
    </>
  );
}

export function StoreScope({
  widgetId,
  ecommerceModuleStoreSlug,
  language,
  children,
}: IStoreScopeProps) {
  const ru = language === "ru";
  const fallback = (
    <p className="rounded-lg border border-border bg-card p-5 text-sm">
      {ru
        ? "Войдите в аккаунт, чтобы открыть воронки магазина."
        : "Sign in to open the store’s funnels."}
    </p>
  );

  if (!ecommerceModuleStoreSlug) {
    return (
      <FunnelError
        language={language}
        message={ru ? "Магазин не указан." : "Store not specified."}
      />
    );
  }
  return (
    <div className="grid min-w-0 gap-4" lang={ru ? "ru" : "en"}>
      <Subject
        isServer={false}
        variant="authentication-me-default"
        fallback={fallback}
      >
        {({ data, authenticated }) =>
          data && authenticated ? (
            <StoreForSubject
              widgetId={widgetId}
              key={`${data.id}:${ecommerceModuleStoreSlug}`}
              subjectId={data.id}
              ecommerceModuleStoreSlug={ecommerceModuleStoreSlug}
              language={language}
            >
              {children}
            </StoreForSubject>
          ) : (
            fallback
          )
        }
      </Subject>
    </div>
  );
}
