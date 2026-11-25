"use client";

import { StoreSection, type IStoreSectionContentProps } from "../StoreSection";
import { StoreSectionStatus } from "../StoreSectionStatus";
import { StoreEmployees } from "./StoreEmployees";

export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  language,
}: IStoreSectionContentProps) {
  const ru = language === "ru";
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="employees"
    >
      {(session) =>
        session.access ? (
          <StoreEmployees
            key={`${session.access.subjectId}:${ecommerceModuleStore.id}`}
            storeId={session.access.store.id}
            storeSlug={ecommerceModuleStore.slug}
            subjectId={session.access.subjectId}
            language={language}
            canManageEmployees={session.access.store.canManageEmployees}
          />
        ) : (
          <StoreSectionStatus
            session={session}
            language={language}
            deniedMessage={
              ru
                ? "У вас нет доступа к сотрудникам этого магазина."
                : "You do not have access to this store’s employees."
            }
          />
        )
      }
    </StoreSection>
  );
}
