"use client";

import { Component as ParentComponent } from "@sps/blog/models/article/frontend/component";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import { Component as ArticlesToFileStorageModuleWidgets } from "@sps/blog/relations/articles-to-file-storage-module-files/frontend/component";
import { Component as ArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";

import { Component as ArticlesToEcommerceModuleProducts } from "@sps/blog/relations/articles-to-ecommerce-module-products/frontend/component";

import { Component as WidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";

export function Component() {
  return (
    <ParentComponent
      isServer={false}
      variant="admin-table"
      adminForm={(props) => {
        return (
          <ParentComponent
            isServer={false}
            data={props.data}
            variant="admin-form"
            widgetsToArticles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToArticles
                  isServer={isServer}
                  variant="admin-table"
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
            articlesToEcommerceModuleProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ArticlesToEcommerceModuleProducts
                  isServer={isServer}
                  variant="admin-table"
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
            categoriesToArticles={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <CategoriesToArticles
                  isServer={isServer}
                  variant="admin-table"
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
            articlesToFileStorageModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ArticlesToFileStorageModuleWidgets
                  isServer={isServer}
                  variant="admin-table"
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
            articlesToWebsiteBuilderModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ArticlesToWebsiteBuilderModuleWidgets
                  isServer={isServer}
                  variant="admin-table"
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
      }}
    />
  );
}
