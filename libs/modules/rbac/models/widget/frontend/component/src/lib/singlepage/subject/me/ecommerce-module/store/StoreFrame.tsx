import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import type { IModel as IEcommerceModuleStore } from "@sps/ecommerce/models/store/sdk/model";
import { Component as PresentationLink } from "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component";
import type { ReactNode } from "react";

interface IStoreFrameProps {
  isServer: boolean;
  language: string;
  variant: string;
  widgetId: string;
  ecommerceModuleStoreSlug?: string;
  children: (ecommerceModuleStore: IEcommerceModuleStore) => ReactNode;
}

export function StoreFrame({
  isServer,
  language,
  variant,
  widgetId,
  ecommerceModuleStoreSlug,
  children,
}: IStoreFrameProps) {
  if (!ecommerceModuleStoreSlug) return null;
  const ru = language === "ru";

  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={variant}
      data-id={widgetId}
      className="w-full min-w-0"
    >
      <PresentationLink
        isServer={isServer}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [{ column: "widgetId", method: "eq", value: widgetId }],
            },
          },
        }}
      >
        {({ data }) =>
          data?.length === 1 ? (
            <PresentationLink
              isServer={isServer}
              variant="default"
              dataSource="props"
              data={data[0]}
              language={language}
            >
              <EcommerceModuleStore
                isServer={isServer}
                variant="find"
                apiProps={{
                  params: {
                    limit: 1,
                    filters: {
                      and: [
                        {
                          column: "slug",
                          method: "eq",
                          value: ecommerceModuleStoreSlug,
                        },
                      ],
                    },
                  },
                }}
              >
                {({ data: stores }) =>
                  stores?.[0] ? (
                    children(stores[0])
                  ) : (
                    <p role="alert">
                      {ru ? "Магазин не найден." : "Store not found."}
                    </p>
                  )
                }
              </EcommerceModuleStore>
            </PresentationLink>
          ) : (
            <p role="alert">
              {ru
                ? "Страница магазина недоступна."
                : "The store page is unavailable."}
            </p>
          )
        }
      </PresentationLink>
    </div>
  );
}
