import { Component as Page } from "@sps/host/models/page/frontend/component";
import type { IExternalWidgetProps } from "../interface";
import { Component as RbacModuleWidget } from "@sps/rbac/models/widget/frontend/component";
export function Component(props: IExternalWidgetProps) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-values"
      url={props.url}
    >
      {({ data: routeParams }) => (
        <RbacModuleWidget
          isServer={props.isServer}
          variant="find"
          apiProps={{
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "eq",
                    value: props.data.externalWidgetId,
                  },
                ],
              },
            },
          }}
        >
          {({ data }) =>
            data?.map((entity) => (
              <RbacModuleWidget
                key={entity.id}
                isServer={props.isServer}
                dataSource="props"
                data={entity}
                language={props.language}
                socialModuleChatId={routeParams?.["social.chats.id"]}
                socialModuleThreadId={routeParams?.["social.threads.id"]}
                subjectSlug={routeParams?.["rbac.subjects.slug"]}
                rbacSubjectId={routeParams?.["rbac.subjects.id"]}
                ecommerceModuleOrderId={routeParams?.["ecommerce.orders.id"]}
                ecommerceModuleProductId={
                  routeParams?.["ecommerce.products.id"]
                }
                ecommerceModuleProductSlug={
                  routeParams?.["ecommerce.products.slug"]
                }
                ecommerceModuleCategorySlug={
                  routeParams?.["ecommerce.categories.slug"]
                }
                ecommerceModuleStoreSlug={
                  routeParams?.["ecommerce.stores.slug"]
                }
                crmModuleFunnelSlug={routeParams?.["crm.funnels.slug"]}
                crmModuleTaskId={routeParams?.["crm.tasks.id"]}
                variant={entity.variant as any}
              />
            ))
          }
        </RbacModuleWidget>
      )}
    </Page>
  );
}
