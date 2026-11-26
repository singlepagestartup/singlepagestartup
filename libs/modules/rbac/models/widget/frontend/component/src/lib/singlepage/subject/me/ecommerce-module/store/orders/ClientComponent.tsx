"use client";

import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { OrderColumns } from "@sps/ecommerce/models/order/frontend/component/src/lib/singlepage/store-list-row/Columns";
import { Component as StoreManagementTable } from "@sps/shared-frontend-components/singlepage/store-management-table";
import type { IStoreTableParams } from "@sps/shared-frontend-components/singlepage/store-management-table/interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IStoreOrderRow } from "@sps/ecommerce/models/order/sdk/model";
import { storeOrderHref } from "../paths";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { StoreSection, type IStoreSectionContentProps } from "../StoreSection";
import { StoreSectionStatus } from "../StoreSectionStatus";

export function OrderList({
  customerId,
  subjectId,
  storeId,
  storeSlug,
  language,
  deniedMessage,
}: {
  customerId?: string;
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
  deniedMessage: string;
}) {
  const ru = language === "ru";
  function useOrdersPage({ offset, limit, search }: IStoreTableParams) {
    const result = api.crmWorkspace.useOrders({
      id: subjectId,
      params: {
        storeId,
        offset,
        limit,
        ...(customerId && { customerId }),
        ...(search && { search }),
      },
    });
    return { ...result, denied: hasStatus(result.error, 401, 403) };
  }
  return (
    <StoreManagementTable
      isServer={false}
      title={
        customerId
          ? ru
            ? "Заказы клиента"
            : "Customer orders"
          : ru
            ? "Заказы"
            : "Orders"
      }
      language={language}
      searchPlaceholder={
        ru ? "Поиск по номеру заказа" : "Search by order number"
      }
      emptyMessage={ru ? "Заказов пока нет." : "No orders yet."}
      deniedMessage={deniedMessage}
      usePage={useOrdersPage}
      header={<OrderColumns language={language} showItems={!!customerId} />}
      renderRow={(order: IStoreOrderRow) => (
        <EcommerceModuleOrder
          key={order.id}
          showItems={!!customerId}
          data={order}
          language={language}
          isServer={false}
          dataSource="props"
          variant="store-list-row"
          href={storeOrderHref(language, storeSlug, order.id)}
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
  const ru = language === "ru";
  const deniedMessage = ru
    ? "У вас нет доступа к заказам этого магазина."
    : "You do not have access to this store’s orders.";
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="orders"
    >
      {(session) =>
        session.access?.store.canManageTasks ? (
          <OrderList
            key={`${session.access.subjectId}:${session.access.store.id}`}
            subjectId={session.access.subjectId}
            storeId={session.access.store.id}
            storeSlug={session.access.store.slug}
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
