"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  IStoreCatalogDirectoryItem,
  TStoreCatalogDirectoryKind,
} from "@sps/rbac/models/subject/sdk/model";
import { Component as StoreManagementTable } from "@sps/shared-frontend-components/singlepage/store-management-table";
import type { IStoreTableParams } from "@sps/shared-frontend-components/singlepage/store-management-table/interface";
import { memo, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  SettingsDialogContent,
  SettingsDialogHeader,
} from "@sps/shared-ui-shadcn/dialog";
import { Button } from "@sps/shared-ui-shadcn/button";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import { hasStatus } from "../../../../../../subject-me-crm-module-store-workspace/view-model";
import {
  directoryKeyTitle,
  directoryItemLabel,
  directoryTitles,
  directoryValue,
} from "./labels";
import { DirectoryCreate, DirectoryForm } from "./DirectoryCreate";

interface IDirectoryProps {
  subjectId: string;
  storeId: string;
  kind: TStoreCatalogDirectoryKind;
  language: string;
}
const columns = "md:grid-cols-2";
const DirectoryRow = memo(function DirectoryRow({
  item,
  kind,
  language,
  subjectId,
  storeId,
}: {
  subjectId: string;
  storeId: string;
  item: IStoreCatalogDirectoryItem;
  kind: TStoreCatalogDirectoryKind;
  language: string;
}) {
  const [open, setOpen] = useState(false);
  const ru = language === "ru";
  const isKey = kind === "attribute-keys";
  const isAttribute = kind === "attributes";
  const title = isAttribute
    ? directoryKeyTitle(item, language)
    : directoryItemLabel(item, language);
  let detail = item.slug;
  if (isAttribute) detail = directoryValue(item, language);
  if (isKey)
    detail =
      item.field === "number"
        ? ru
          ? "Число"
          : "Number"
        : ru
          ? "Текст"
          : "Text";
  return (
    <li className="min-w-0">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className={`grid w-full min-w-0 gap-1 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:gap-4 ${columns}`}
          >
            <span className="min-w-0 break-words font-semibold">
              {title || item.adminTitle || item.slug}
            </span>
            <span className="min-w-0 break-words text-muted-foreground">
              {detail}
            </span>
          </button>
        </DialogTrigger>
        {open && (
          <SettingsDialogContent
            aria-describedby={undefined}
            closeLabel={ru ? "Закрыть" : "Close"}
          >
            <SettingsDialogHeader
              title={title || item.adminTitle || item.slug}
            />
            <RecordEditor
              subjectId={subjectId}
              storeId={storeId}
              kind={kind}
              recordId={item.id}
              language={language}
              onSaved={() => setOpen(false)}
            />
          </SettingsDialogContent>
        )}
      </Dialog>
    </li>
  );
});

function RecordEditor(
  props: IDirectoryProps & { recordId: string; onSaved: () => void },
) {
  const scope = {
    id: props.subjectId,
    storeId: props.storeId,
    kind: props.kind,
    recordId: props.recordId,
  };
  const detail = api.storeCatalogDirectories.useDetail({
    ...scope,
    enabled: true,
  });
  const save = api.storeCatalogDirectories.useUpdate(scope);
  const ru = props.language === "ru";
  if (detail.isError) {
    return (
      <div>
        <p role="alert">
          {ru ? "Не удалось открыть запись." : "Could not load this record."}
        </p>
        <Button
          variant="outline"
          type="button"
          onClick={() => void detail.refetch()}
        >
          {ru ? "Повторить" : "Retry"}
        </Button>
      </div>
    );
  }
  if (!detail.data) return <p role="status">{ru ? "Загрузка…" : "Loading…"}</p>;
  return (
    <DirectoryForm
      {...props}
      item={detail.data}
      saveUpdate={save.mutateAsync}
      pending={save.isPending}
      error={save.error}
    />
  );
}

function Directory({
  subjectId,
  storeId,
  kind,
  language,
  canCreate,
}: IDirectoryProps & { canCreate: boolean }) {
  const ru = language === "ru";
  function useDirectoryPage(params: IStoreTableParams) {
    const result = api.storeCatalogDirectories.useList({
      id: subjectId,
      storeId,
      kind,
      ...params,
    });
    return {
      ...result,
      showAction: result.data?.canCreate === true,
      denied: hasStatus(result.error, 401, 403),
    };
  }
  return (
    <StoreManagementTable
      isServer={false}
      language={language}
      title={directoryTitles[kind][ru ? "ru" : "en"]}
      searchPlaceholder={ru ? "Поиск в справочнике" : "Search directory"}
      emptyMessage={ru ? "Пока нет записей." : "No entries yet."}
      deniedMessage={
        ru
          ? "У вас нет доступа к этому справочнику."
          : "You do not have access to this directory."
      }
      action={
        canCreate && (
          <DirectoryCreate
            subjectId={subjectId}
            storeId={storeId}
            kind={kind}
            language={language}
          />
        )
      }
      header={
        <div
          aria-hidden="true"
          className={`grid gap-4 px-4 py-1.5 text-xs font-medium text-muted-foreground max-md:[&>span:not(:first-child)]:hidden ${columns}`}
        >
          <span>
            {kind === "attributes"
              ? ru
                ? "Ключ"
                : "Key"
              : ru
                ? "Название"
                : "Name"}
          </span>
          <span>
            {kind === "attributes"
              ? ru
                ? "Значение"
                : "Value"
              : kind === "categories"
                ? ru
                  ? "Адрес категории"
                  : "Category slug"
                : ru
                  ? "Тип значения"
                  : "Value type"}
          </span>
        </div>
      }
      usePage={useDirectoryPage}
      renderRow={(item: IStoreCatalogDirectoryItem) => (
        <DirectoryRow
          key={item.id}
          storeId={storeId}
          subjectId={subjectId}
          item={item}
          language={language}
          kind={kind}
        />
      )}
    />
  );
}

export function ClientComponent({
  kind,
  ...props
}: IStoreSectionContentProps & { kind: TStoreCatalogDirectoryKind }) {
  return (
    <StoreSection {...props} section="products" directory={kind}>
      {(session) =>
        session.access ? (
          <Directory
            key={`${session.access.subjectId}:${props.ecommerceModuleStore.id}:${kind}`}
            subjectId={session.access.subjectId}
            storeId={props.ecommerceModuleStore.id}
            kind={kind}
            language={props.language}
            canCreate={session.access.store.canManageCatalog === true}
          />
        ) : (
          <StoreSectionStatus
            session={session}
            language={props.language}
            deniedMessage={
              props.language === "ru"
                ? "У вас нет доступа к справочнику магазина."
                : "You do not have access to this store directory."
            }
          />
        )
      }
    </StoreSection>
  );
}
