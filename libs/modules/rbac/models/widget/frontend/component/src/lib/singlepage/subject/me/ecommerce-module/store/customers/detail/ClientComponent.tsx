"use client";

import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceStore } from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";
import { hasStatus } from "../../../../../../subject-me-crm-module-store-workspace/view-model";
import { storeList } from "../../../../../../subject-me-crm-module-store-workspace/primitives";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import { OrderList } from "../../orders/ClientComponent";
import { localizedText } from "../../products/view-model";

interface ICustomerDetailProps {
  subjectId: string;
  customerId: string;
  store: ICrmWorkspaceStore;
  language: string;
}

function CustomerDetail({
  subjectId,
  customerId,
  store,
  language,
}: ICustomerDetailProps) {
  const ru = language === "ru";
  const reading = api.crmWorkspace.useCustomer({
    id: subjectId,
    params: { storeId: store.id, customerId },
  });
  if (hasStatus(reading.error, 401, 403, 404))
    return (
      <p role="alert">
        {ru
          ? "Клиент недоступен в этом магазине."
          : "Customer unavailable in this store."}
      </p>
    );
  if (reading.isError)
    return (
      <div className={storeList.panel}>
        <p role="alert">
          {ru
            ? "Не удалось загрузить профиль клиента."
            : "Could not load the customer profile."}
        </p>
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => void reading.refetch()}
        >
          {ru ? "Повторить" : "Retry"}
        </Button>
      </div>
    );
  const customer = reading.data;
  if (!customer)
    return (
      <p role="status">
        {ru ? "Загружаем профиль клиента…" : "Loading customer profile…"}
      </p>
    );
  const subtitle = localizedText(customer.subtitle, language);
  return (
    <>
      <section className={storeList.panel}>
        <h1 className={storeList.title}>
          {localizedText(customer.title, language) || customer.subjectSlug}
        </h1>
        {customer.profileSlug && (
          <p className="break-all text-sm text-muted-foreground">
            @{customer.profileSlug}
          </p>
        )}
        {subtitle && <p className="break-words text-sm">{subtitle}</p>}
      </section>
      <OrderList
        key={customerId}
        customerId={customerId}
        subjectId={subjectId}
        storeId={store.id}
        storeSlug={store.slug}
        language={language}
        deniedMessage={
          ru
            ? "У вас нет доступа к заказам этого клиента."
            : "You do not have access to this customer's orders."
        }
      />
    </>
  );
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  rbacSubjectId,
  language,
}: IStoreSectionContentProps & { rbacSubjectId: string }) {
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      section="customers"
      language={language}
    >
      {(session) =>
        session.access?.store.canManageTasks ? (
          <CustomerDetail
            store={session.access.store}
            customerId={rbacSubjectId}
            subjectId={session.access.subjectId}
            language={language}
          />
        ) : (
          <StoreSectionStatus
            session={session}
            language={language}
            deniedMessage={
              language === "ru"
                ? "У вас нет доступа к этому профилю клиента."
                : "You do not have access to this customer profile."
            }
          />
        )
      }
    </StoreSection>
  );
}
