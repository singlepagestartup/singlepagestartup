"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as BlogModuleArticle } from "@sps/blog/models/article/frontend/component";
import { Component as BlogModuleArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <Subject
      isServer={false}
      variant="authentication-is-authorized-wrapper-default"
      apiProps={{
        params: {
          permission: {
            method: "GET",
            route: "/api/blog/articles-to-website-builder-module-widgets",
          },
        },
      }}
      fallback={
        <BlogModuleArticle
          isServer={false}
          variant="private-content-default"
          language={props.language}
          access="locked"
          actionHref={`/${props.language}/ecommerce`}
        />
      }
    >
      <BlogModuleArticlesToWebsiteBuilderModuleWidgets
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "articleId",
                  method: "eq",
                  value: props.blogModuleArticle.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) =>
          data?.map((entity) => (
            <BlogModuleArticlesToWebsiteBuilderModuleWidgets
              key={entity.id}
              isServer={false}
              variant={entity.variant as any}
              dataSource="props"
              data={entity}
              language={props.language}
            />
          ))
        }
      </BlogModuleArticlesToWebsiteBuilderModuleWidgets>
    </Subject>
  );
}
