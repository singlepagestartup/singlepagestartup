"use client";

import { memo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICrmWorkspaceCustomer,
  ICrmWorkspaceStore,
} from "@sps/rbac/models/subject/sdk/model";
import { Component as StoreManagementTable } from "@sps/shared-frontend-components/singlepage/store-management-table";
import type { IStoreTableParams } from "@sps/shared-frontend-components/singlepage/store-management-table/interface";
import { storeList } from "../../../../../subject-me-crm-module-store-workspace/primitives";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { StoreSection, type IStoreSectionContentProps } from "../StoreSection";
import { StoreSectionStatus } from "../StoreSectionStatus";
import { storeCustomerHref } from "../paths";
import { localizedText } from "../products/view-model";

interface ICustomerRowProps {
  customer: ICrmWorkspaceCustomer;
  language: string;
  storeSlug: string;
}
const columns = "grid-cols-[minmax(0,1fr)_auto_1rem]";
const CustomerRow = memo(function CustomerRow({
  customer,
  language,
  storeSlug,
}: ICustomerRowProps) {
  const name = localizedText(customer.title, language) || customer.subjectSlug;
  return (
    <li>
      <Link
        href={storeCustomerHref(language, storeSlug, customer.subjectId)}
        className={`${storeList.row} grid ${columns} items-center gap-4 px-4 py-3 text-sm`}
      >
        <span className="grid min-w-0 gap-0.5">
          <span className="break-words font-semibold">{name}</span>
          {customer.profileSlug && (
            <span className="break-all text-muted-foreground">
              @{customer.profileSlug}
            </span>
          )}
        </span>
        <span className="tabular-nums">
          <span className="sr-only">
            {language === "ru" ? "Заказы " : "Orders "}
          </span>
          {customer.orderCount}
        </span>
        <ChevronRight className={storeList.arrow} aria-hidden="true" />
      </Link>
    </li>
  );
});

function CustomerList({
  store,
  subjectId,
  language,
  deniedMessage,
}: {
  store: ICrmWorkspaceStore;
  subjectId: string;
  language: string;
  deniedMessage: string;
}) {
  const ru = language === "ru";
  function useCustomersPage({ offset, limit, search }: IStoreTableParams) {
    const result = api.crmWorkspace.useCustomers({
      id: subjectId,
      params: { storeId: store.id, offset, limit, ...(search && { search }) },
    });
    return { ...result, denied: hasStatus(result.error, 401, 403) };
  }
  return (
    <StoreManagementTable
      isServer={false}
      title={ru ? "Клиенты" : "Customers"}
      language={language}
      searchPlaceholder={
        ru
          ? "Поиск по имени или адресу профиля"
          : "Search by name or profile handle"
      }
      emptyMessage={ru ? "В магазине пока нет клиентов." : "No customers yet."}
      deniedMessage={deniedMessage}
      usePage={useCustomersPage}
      header={
        <div
          aria-hidden="true"
          className={`grid ${columns} gap-4 px-4 text-xs font-medium text-muted-foreground`}
        >
          <span>{ru ? "Клиент" : "Customer"}</span>
          <span>{ru ? "Заказы" : "Orders"}</span>
        </div>
      }
      renderRow={(customer: ICrmWorkspaceCustomer) => (
        <CustomerRow
          key={customer.subjectId}
          customer={customer}
          language={language}
          storeSlug={store.slug}
        />
      )}
    />
  );
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  language,
}: IStoreSectionContentProps) {
  const deniedMessage =
    language === "ru"
      ? "У вас нет доступа к клиентам этого магазина."
      : "You do not have access to this store’s customers.";
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      section="customers"
      language={language}
    >
      {(session) =>
        session.access?.store.canManageTasks ? (
          <CustomerList
            store={session.access.store}
            subjectId={session.access.subjectId}
            language={language}
            deniedMessage={deniedMessage}
          />
        ) : (
          <StoreSectionStatus
            session={session}
            language={language}
            deniedMessage={deniedMessage}
          />
        )
      }
    </StoreSection>
  );
}
