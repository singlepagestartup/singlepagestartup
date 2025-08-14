"use client";

import { Component as ParentComponent } from "@sps/blog/models/category/frontend/component";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
import { Component as WidgetsToCategories } from "@sps/blog/relations/widgets-to-categories/frontend/component";

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
            widgetsToCategories={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToCategories
                  isServer={isServer}
                  variant="admin-table"
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
      }}
    />
  );
}
