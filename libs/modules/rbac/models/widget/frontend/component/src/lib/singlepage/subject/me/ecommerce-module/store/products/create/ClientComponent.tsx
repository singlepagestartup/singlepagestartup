"use client";

import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import {
  StoreSection,
  type IStoreSectionContentProps,
} from "../../StoreSection";
import { StoreSectionStatus } from "../../StoreSectionStatus";
import { ProductForm } from "./ProductForm";

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
      section="products"
    >
      {(session) => (
        <section className={`${settingsFormStyles.panel} grid w-full gap-6`}>
          <h1 className={settingsFormStyles.title}>
            {ru ? "Новый товар" : "New product"}
          </h1>
          {session.access?.store.canManageCatalog ? (
            <ProductForm
              key={`${ecommerceModuleStore.id}:${session.access.subjectId}`}
              ecommerceModuleStore={ecommerceModuleStore}
              language={language}
              subjectId={session.access.subjectId}
            />
          ) : (
            <StoreSectionStatus
              language={language}
              session={session}
              deniedMessage={
                ru
                  ? "У вас нет права добавлять товары."
                  : "You do not have permission to add products."
              }
            />
          )}
        </section>
      )}
    </StoreSection>
  );
}
