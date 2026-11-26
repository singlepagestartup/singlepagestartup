"use client";

import { StoreSection, type IStoreSectionContentProps } from "../StoreSection";
import { StoreSectionStatus } from "../StoreSectionStatus";
import { StoreSettingsForm } from "./StoreSettingsForm";
import { settingsFormStyles } from "@sps/shared-ui-shadcn";

export function ClientComponent({
  widgetId,
  ecommerceModuleStore,
  language,
}: IStoreSectionContentProps) {
  return (
    <StoreSection
      widgetId={widgetId}
      ecommerceModuleStore={ecommerceModuleStore}
      language={language}
      section="settings"
    >
      {(session) =>
        session.access?.store.canManageCatalog ? (
          <StoreSettingsForm
            key={session.access.subjectId + ":" + ecommerceModuleStore.id}
            subjectId={session.access.subjectId}
            ecommerceModuleStore={ecommerceModuleStore}
            language={language}
          />
        ) : (
          <div className={settingsFormStyles.panel}>
            <StoreSectionStatus
              language={language}
              session={session}
              deniedMessage={
                language === "ru"
                  ? "Для редактирования магазина нужны права на управление каталогом."
                  : "You need catalog management access to edit this store."
              }
            />
          </div>
        )
      }
    </StoreSection>
  );
}
