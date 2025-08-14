"use client";

import { Component as ParentComponent } from "@sps/blog/models/widget/frontend/component";

import { Component as WidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";
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
                            column: "widgetId",
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
                            column: "widgetId",
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
