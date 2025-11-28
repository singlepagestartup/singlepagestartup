"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { Component as BlogModuleArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";
import { IModel } from "@sps/blog/models/article/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    children?: React.ReactNode;
    language: string;
  },
) {
  return (
    <RbacModuleSubject
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
      fallback={<div className="p-5 bg-blue-400">Not authorized</div>}
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
              <BlogModuleArticlesToWebsiteBuilderModuleWidgets
                key={index}
                isServer={false}
                variant={entity.variant as any}
                data={entity}
                language={props.language}
              />
            );
          });
        }}
      </BlogModuleArticlesToWebsiteBuilderModuleWidgets>
    </RbacModuleSubject>
  );
}
