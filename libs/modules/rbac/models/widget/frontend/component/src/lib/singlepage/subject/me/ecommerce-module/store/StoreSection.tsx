"use client";

import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICrmWorkspaceStore,
  TStoreCatalogDirectoryKind,
  IModel as ISubject,
} from "@sps/rbac/models/subject/sdk/model";
import type { ReactNode } from "react";
import { hasStatus } from "../../../../subject-me-crm-module-store-workspace/view-model";
import { StoreHeader } from "./StoreHeader";
import type { TStoreSection } from "./paths";

interface IStoreAccess {
  subjectId: string;
  subject: ISubject;
  store: ICrmWorkspaceStore;
}

export interface IStoreSession {
  access?: IStoreAccess;
  pending?: boolean;
  retry?: () => void;
}

export interface IStoreSectionContentProps {
  widgetId: string;
  ecommerceModuleStore: IEcommerceModuleStore;
  language: string;
}

interface IStoreSectionProps extends IStoreSectionContentProps {
  section: TStoreSection;
  taskAccess?: boolean;
  directory?: TStoreCatalogDirectoryKind;
  children?: (session: IStoreSession) => ReactNode;
}

function ResolvedAccess({
  subject,
  storeId,
  storeSlug,
  taskAccess,
  children,
}: {
  subject: ISubject;
  storeId: string;
  storeSlug: string;
  taskAccess: boolean;
  children: (session: IStoreSession) => ReactNode;
}) {
  const stores = api.crmWorkspace.useStores(subject.id, storeSlug, taskAccess);
  const denied = hasStatus(stores.error, 401, 403);
  const store = denied
    ? undefined
    : stores.data?.find(({ id }) => id === storeId);
  return children({
    access: store ? { subjectId: subject.id, subject, store } : undefined,
    pending: stores.isPending,
    retry: stores.isError && !denied ? () => void stores.refetch() : undefined,
  });
}

export function StoreSection({
  widgetId,
  ecommerceModuleStore,
  language,
  section,
  taskAccess = false,
  directory,
  children,
}: IStoreSectionProps) {
  function render(session: IStoreSession) {
    return (
      <div className="grid min-w-0 gap-5">
        <StoreHeader
          language={language}
          widgetId={widgetId}
          storeId={ecommerceModuleStore.id}
          ecommerceModuleStore={ecommerceModuleStore}
          storeSlug={ecommerceModuleStore.slug}
          section={section}
          directory={directory}
          access={session.access?.store}
        />
        {children?.(session)}
      </div>
    );
  }

  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={render({})}
      skeleton={render({ pending: true })}
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <ResolvedAccess
            key={`${data.id}:${ecommerceModuleStore.id}`}
            subject={data}
            storeId={ecommerceModuleStore.id}
            storeSlug={ecommerceModuleStore.slug}
            taskAccess={taskAccess}
          >
            {render}
          </ResolvedAccess>
        ) : (
          render({})
        )
      }
    </Subject>
  );
}
