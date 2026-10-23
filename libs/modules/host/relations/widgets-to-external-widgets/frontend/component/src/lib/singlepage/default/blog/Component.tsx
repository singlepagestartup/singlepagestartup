import { BylineSkeleton as SocialModuleProfileBylineSkeleton } from "@sps/social/models/profile/frontend/component";
import { Component as SocialModuleProfilesToBlogModuleArticles } from "@sps/social/relations/profiles-to-blog-module-articles/frontend/component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import type { IExternalWidgetProps } from "../interface";
import { Component as BlogModuleWidget } from "@sps/blog/models/widget/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
export function Component(props: IExternalWidgetProps) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-values"
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
                renderAuthor={({ data, size, inverse }) => (
                  <SocialModuleProfilesToBlogModuleArticles
                    isServer={props.isServer}
                    variant="find"
                    skeleton={
                      <SocialModuleProfileBylineSkeleton
                        size={size}
                        inverse={inverse}
                      />
                    }
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            {
                              column: "blogModuleArticleId",
                              method: "eq",
                              value: data.id,
                            },
                          ],
                        },
                        orderBy: {
                          and: [{ column: "orderIndex", method: "asc" }],
                        },
                      },
                    }}
                  >
                    {({ data: links }) =>
                      links?.length ? (
                        <div className="flex min-w-0 flex-wrap gap-4">
                          {links.map((link) => (
                            <SocialModuleProfilesToBlogModuleArticles
                              key={link.id}
                              isServer={props.isServer}
                              variant="author-default"
                              dataSource="props"
                              data={link}
                              language={props.language}
                              size={size}
                              inverse={inverse}
                            />
                          ))}
                        </div>
                      ) : null
                    }
                  </SocialModuleProfilesToBlogModuleArticles>
                )}
                renderContent={({ data }) => (
                  <RbacModuleSubject
                    isServer={false}
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
