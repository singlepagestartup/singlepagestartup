"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as WidgetsToCategories } from "@sps/ecommerce/relations/widgets-to-categories/frontend/component";
import { Component as WidgetsToProducts } from "@sps/ecommerce/relations/widgets-to-products/frontend/component";

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
            widgetsToProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <WidgetsToProducts
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
