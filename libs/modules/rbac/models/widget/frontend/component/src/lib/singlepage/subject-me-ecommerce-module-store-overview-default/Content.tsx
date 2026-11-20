import { StoreManagement } from "./StoreManagement";
import { ProviderSettings } from "./ProviderSettings";
import { Component as EcommerceModuleStore } from "@sps/ecommerce/models/store/frontend/component";
import { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  const data = props.ecommerceModuleStoreSlug;
  if (!data) return null;
  return (
    <EcommerceModuleStore
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: data,
              },
            ],
          },
        },
      }}
    >
      {({ data: stores }) => {
        return stores?.map((store) => {
          return (
            <EcommerceModuleStore
              key={store.id}
              isServer={props.isServer}
              variant="overview-default"
              dataSource="props"
              data={store}
              language={props.language}
            >
              <StoreManagement
                ecommerceModuleStore={store}
                language={props.language}
                providerSettings={
                  <ProviderSettings
                    ecommerceModuleStoreId={store.id}
                    language={props.language}
                  />
                }
              />
            </EcommerceModuleStore>
          );
        });
      }}
    </EcommerceModuleStore>
  );
}
