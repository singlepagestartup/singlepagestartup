"use client";

import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import { EmployeeProfile } from "./EmployeeProfile";

interface IEmployeePageProps extends IStoreSectionContentProps {
  rbacSubjectId: string;
}

export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  rbacSubjectId,
  language,
}: IEmployeePageProps) {
  const ru = language === "ru";
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="employees"
      taskAccess
    >
      {(session) =>
        session.access ? (
          <EmployeeProfile
            key={rbacSubjectId}
            actor={session.access.subject}
            subjectId={rbacSubjectId}
            storeId={session.access.store.id}
            storeSlug={ecommerceModuleStore.slug}
            language={language}
          />
        ) : (
          <StoreSectionStatus
            language={language}
            session={session}
            deniedMessage={
              ru
                ? "У вас нет доступа к сотрудникам этого магазина."
                : "You do not have access to this store's employees."
            }
          />
        )
      }
    </StoreSection>
  );
}
