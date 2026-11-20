"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { Package, Users, Workflow } from "lucide-react";
import type { ReactNode } from "react";
import { secondaryClass } from "../subject-me-crm-module-store-workspace/primitives";
import { Workspace } from "../subject-me-crm-module-store-workspace/Workspace";
import { StoreEmployees } from "./StoreEmployees";
import { StoreProducts } from "./StoreProducts";

interface IStoreManagementProps {
  ecommerceModuleStore: IEcommerceModuleStore;
  language: string;
  providerSettings: ReactNode;
}

function ManagementContent({
  ecommerceModuleStore,
  subjectId,
  language,
  providerSettings,
}: IStoreManagementProps & { subjectId: string }) {
  const stores = api.crmWorkspace.useStores(subjectId);
  const ru = language === "ru";
  const status = (stores.error as { status?: number } | null)?.status;
  const store =
    status !== 401 && status !== 403
      ? stores.data?.find(({ id }) => id === ecommerceModuleStore.id)
      : undefined;

  return (
    <div className="grid min-w-0 gap-5">
      {store && (
        <nav
          aria-label={ru ? "Разделы магазина" : "Store sections"}
          className="flex flex-wrap gap-2"
        >
          <a href="#store-products" className={secondaryClass}>
            <Package aria-hidden="true" className="size-4" />
            {ru ? "Товары" : "Products"}
          </a>
          {store.canManageEmployees && (
            <a href="#store-employees" className={secondaryClass}>
              <Users aria-hidden="true" className="size-4" />
              {ru ? "Сотрудники" : "Employees"}
            </a>
          )}
          <a href="#store-workspace" className={secondaryClass}>
            <Workflow aria-hidden="true" className="size-4" />
            {ru ? "Воронки и задачи" : "Funnels and tasks"}
          </a>
        </nav>
      )}
      {providerSettings}
      <StoreProducts
        ecommerceModuleStore={ecommerceModuleStore}
        subjectId={store?.canManageCatalog ? subjectId : undefined}
        language={language}
      />
      {store && (
        <>
          <StoreEmployees
            storeId={store.id}
            subjectId={subjectId}
            language={language}
          />
          <Workspace
            subjectId={subjectId}
            storeSlug={store.slug}
            language={language}
            embedded
          />
        </>
      )}
    </div>
  );
}

export function StoreManagement(props: IStoreManagementProps) {
  const catalog = (
    <StoreProducts
      ecommerceModuleStore={props.ecommerceModuleStore}
      language={props.language}
    />
  );
  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={catalog}
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <ManagementContent
            ecommerceModuleStore={props.ecommerceModuleStore}
            language={props.language}
            subjectId={data.id}
            providerSettings={props.providerSettings}
          />
        ) : (
          catalog
        )
      }
    </Subject>
  );
}
