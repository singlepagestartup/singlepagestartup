import { Component as Page } from "@sps/host/models/page/frontend/component";
import type { IExternalWidgetProps } from "../interface";
import { Component as BlogModuleWidget } from "@sps/blog/models/widget/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
export function Component(props: IExternalWidgetProps) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-values"
      language={props.language}
      url={props.url}
    >
      {({ data: routeParams }) => (
        <BlogModuleWidget
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
              <BlogModuleWidget
                key={entity.id}
                isServer={props.isServer}
                dataSource="props"
                data={entity}
                language={props.language}
                articleSlug={routeParams?.["blog.articles.slug"]}
                categorySlug={routeParams?.["blog.categories.slug"]}
                variant={entity.variant as any}
                renderPrivateContent={({ data }) => (
                  <RbacModuleSubject
                    isServer={props.isServer}
                    variant="me-blog-module-article-private-content-default"
                    blogModuleArticle={data}
                    language={props.language}
                  />
                )}
                renderProduct={({ data }) => (
                  <RbacModuleSubject
                    isServer={false}
                    variant="me-ecommerce-module-product-card-default"
                    ecommerceModuleProduct={data}
                    language={props.language}
                  />
                )}
              />
            ))
          }
        </BlogModuleWidget>
      )}
    </Page>
  );
}
