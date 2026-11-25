"use client";

import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import { EmployeeForm } from "./EmployeeForm";

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
      {(session) => (
        <section className={`${settingsFormStyles.panel} grid max-w-xl gap-6`}>
          <h1 className={settingsFormStyles.title}>
            {ru ? "Новый сотрудник" : "New employee"}
          </h1>
          {session.access?.store.canManageEmployees ? (
            <EmployeeForm
              subjectId={session.access.subjectId}
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
                  ? "У вас нет права добавлять сотрудников."
                  : "You do not have permission to add employees."
              }
            />
          )}
        </section>
      )}
    </StoreSection>
  );
}
