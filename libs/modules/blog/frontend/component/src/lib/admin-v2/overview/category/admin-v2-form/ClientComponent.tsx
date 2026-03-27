"use client";

import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as Category } from "@sps/blog/models/category/frontend/component";
import { Component as Widget } from "@sps/blog/models/widget/frontend/component";
import { Component as WebsiteBuilderWidget } from "@sps/website-builder/models/widget/frontend/component";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import { Component as WidgetsToCategories } from "@sps/blog/relations/widgets-to-categories/frontend/component";
import { Component as CategoriesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/categories-to-website-builder-module-widgets/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <Category
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      categoriesToArticles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <CategoriesToArticles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Category"
            rightModelAdminFormLabel="Article"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Category
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.categoryId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Article
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.articleId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "categoryId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      widgetsToCategories={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToCategories
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Category"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Widget
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.widgetId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Category
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.categoryId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "categoryId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
      categoriesToWebsiteBuilderModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <CategoriesToWebsiteBuilderModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Category"
            rightModelAdminFormLabel="Website widget"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Category
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.categoryId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <WebsiteBuilderWidget
                  isServer={false}
                  variant="admin-form"
                  data={{ id: data.websiteBuilderModuleWidgetId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "categoryId",
                      method: "eq",
                      value: data.id,
                    },
                  ],
                },
              },
            }}
          />
        );
      }}
    />
  );
}
