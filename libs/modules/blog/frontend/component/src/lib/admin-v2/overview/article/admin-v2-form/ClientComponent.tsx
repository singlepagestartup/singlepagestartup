"use client";

import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as Category } from "@sps/blog/models/category/frontend/component";
import { Component as Widget } from "@sps/blog/models/widget/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { Component as EcommerceProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as WebsiteBuilderWidget } from "@sps/website-builder/models/widget/frontend/component";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import { Component as WidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";
import { Component as ArticlesToEcommerceModuleProducts } from "@sps/blog/relations/articles-to-ecommerce-module-products/frontend/component";
import { Component as ArticlesToFileStorageModuleFiles } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import { Component as ArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <Article
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
                      column: "articleId",
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
      widgetsToArticles={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToArticles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Article"
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
                      column: "articleId",
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
      articlesToEcommerceModuleProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ArticlesToEcommerceModuleProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Article"
            rightModelAdminFormLabel="Product"
            leftModelAdminForm={({ data }) => {
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
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <EcommerceProduct
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.ecommerceModuleProductId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "articleId",
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
      articlesToFileStorageModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ArticlesToFileStorageModuleFiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Article"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
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
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <FileStorageFile
                  isServer={false}
                  variant="admin-form"
                  data={{ id: data.fileStorageModuleFileId } as any}
                />
              );
            }}
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "articleId",
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
      articlesToWebsiteBuilderModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ArticlesToWebsiteBuilderModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Article"
            rightModelAdminFormLabel="Website widget"
            leftModelAdminForm={({ data }) => {
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
                      column: "articleId",
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
