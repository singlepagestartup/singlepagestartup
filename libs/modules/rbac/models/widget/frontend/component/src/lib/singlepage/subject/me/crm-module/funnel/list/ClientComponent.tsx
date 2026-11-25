"use client";

import { Button } from "@sps/shared-ui-shadcn/button";
import { Component as StoreManagementTable } from "@sps/shared-frontend-components/singlepage/store-management-table";
import type { IStoreTableParams } from "@sps/shared-frontend-components/singlepage/store-management-table/interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceFunnel } from "@sps/rbac/models/subject/sdk/model";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import {
  primaryClass,
  storeList,
} from "../../../../../subject-me-crm-module-store-workspace/primitives";
import {
  funnelCreateHref,
  funnelEditHref,
  hasStatus,
} from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { StoreScope, type IFunnelStoreScope } from "../StoreScope";
import type { IComponentProps } from "./interface";

interface IClientProps extends Pick<
  IComponentProps,
  "ecommerceModuleStoreSlug"
> {
  widgetId: string;
  language: string;
}

interface IFunnelListProps extends IFunnelStoreScope {
  language: string;
}

const funnelColumns = "sm:grid-cols-[minmax(0,1fr)_6rem_1rem]";

interface IFunnelRowProps {
  funnel: ICrmWorkspaceFunnel;
  editHref: string;
  language: string;
}

const FunnelRow = memo(function FunnelRow({
  funnel,
  editHref,
  language,
}: IFunnelRowProps) {
  return (
    <li className="min-w-0">
      <Link
        href={editHref}
        aria-labelledby={`store-funnel-name-${funnel.id}`}
        aria-describedby={`store-funnel-stages-${funnel.id}`}
        className={`${storeList.row} ${funnelColumns} grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-x-4 gap-y-1 px-4 py-3 text-sm`}
      >
        <span
          id={`store-funnel-name-${funnel.id}`}
          className="min-w-0 break-words font-semibold"
        >
          {funnel.name}
        </span>
        <span
          id={`store-funnel-stages-${funnel.id}`}
          className="col-start-1 text-xs text-muted-foreground tabular-nums sm:col-start-2 sm:text-sm"
        >
          <span className="sm:sr-only">
            {language === "ru" ? "Этапов" : "Stages"}:{" "}
          </span>
          {funnel.definition.stages.length}
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`${storeList.arrow} col-start-2 row-start-1 sm:col-start-3`}
        />
      </Link>
    </li>
  );
});

function FunnelList({ subjectId, store, language }: IFunnelListProps) {
  const ru = language === "ru";
  function useFunnelsPage({ offset, limit, search }: IStoreTableParams) {
    const result = api.crmWorkspace.useFunnels({
      id: subjectId,
      params: { storeId: store.id, offset, limit, ...(search && { search }) },
    });
    return { ...result, denied: hasStatus(result.error, 401, 403) };
  }
  return (
    <StoreManagementTable
      isServer={false}
      language={language}
      title={ru ? "Воронки магазина" : "Store funnels"}
      searchPlaceholder={
        ru ? "Название или адрес воронки" : "Funnel name or slug"
      }
      emptyMessage={
        ru ? "В магазине пока нет воронок." : "This store has no funnels yet."
      }
      deniedMessage={
        ru
          ? "Нет доступа к воронкам этого магазина."
          : "You do not have access to this store’s funnels."
      }
      usePage={useFunnelsPage}
      action={
        <Button asChild className={primaryClass}>
          <Link href={funnelCreateHref(language, store.slug)}>
            <Plus aria-hidden="true" className="size-4" />
            {ru ? "Новая воронка" : "New funnel"}
          </Link>
        </Button>
      }
      header={
        <div
          aria-hidden="true"
          className={`${funnelColumns} grid gap-x-4 px-4 text-xs font-medium text-muted-foreground max-sm:[&>span:not(:first-child)]:hidden`}
        >
          <span>{ru ? "Воронка" : "Funnel"}</span>
          <span>{ru ? "Этапов" : "Stages"}</span>
        </div>
      }
      renderRow={(funnel: ICrmWorkspaceFunnel) => (
        <FunnelRow
          key={funnel.id}
          funnel={funnel}
          editHref={funnelEditHref(language, store.slug, funnel.slug)}
          language={language}
        />
      )}
    />
  );
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStoreSlug,
  language,
}: IClientProps) {
  return (
    <StoreScope
      widgetId={widgetId}
      ecommerceModuleStoreSlug={ecommerceModuleStoreSlug}
      language={language}
    >
      {(scope) => (
        <FunnelList
          key={`${scope.subjectId}:${scope.store.id}`}
          subjectId={scope.subjectId}
          store={scope.store}
          language={language}
        />
      )}
    </StoreScope>
  );
}
