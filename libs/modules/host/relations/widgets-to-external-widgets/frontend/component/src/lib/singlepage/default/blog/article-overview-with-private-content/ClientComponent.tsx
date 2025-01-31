"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as ArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";
import { IModel } from "@sps/blog/models/article/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    children?: React.ReactNode;
    language: string;
  },
) {
  return (
    <RbacSubject
      isServer={false}
      variant="authentication-is-authorized-wrapper-default"
      apiProps={{
        params: {
          action: {
            method: "GET",
            route: "/api/blog/articles-to-website-builder-module-widgets",
          },
        },
      }}
      fallback={<div className="p-5 bg-blue-400">Not authorized</div>}
    >
      <ArticlesToWebsiteBuilderModuleWidgets
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "articleId",
                  method: "eq",
                  value: props.data.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <ArticlesToWebsiteBuilderModuleWidgets
                key={index}
                isServer={false}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </ArticlesToWebsiteBuilderModuleWidgets>
    </RbacSubject>
  );
}
