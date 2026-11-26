"use client";

import { StoreSection, type IStoreSectionContentProps } from "../StoreSection";
import { StoreSectionStatus } from "../StoreSectionStatus";
import { StoreProducts } from "./StoreProducts";
import { StorefrontProducts } from "./StorefrontProducts";

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
      section="products"
    >
      {(session) =>
        session.access ? (
          <StoreProducts
            key={`${session.access.subjectId}:${ecommerceModuleStore.id}`}
            subjectId={session.access.subjectId}
            storeId={ecommerceModuleStore.id}
            storeSlug={ecommerceModuleStore.slug}
            language={language}
            canManageCatalog={session.access.store.canManageCatalog === true}
          />
        ) : session.pending || session.retry ? (
          <StoreSectionStatus
            session={session}
            language={language}
            deniedMessage={
              language === "ru"
                ? "У вас нет доступа к товарам этого магазина."
                : "You do not have access to this store's products."
            }
          />
        ) : (
          <StorefrontProducts
            key={ecommerceModuleStore.id}
            ecommerceModuleStore={ecommerceModuleStore}
            language={language}
          />
        )
      }
    </StoreSection>
  );
}
