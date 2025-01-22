"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/category/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as CategoriesToFileStorageModuleWidgets } from "@sps/ecommerce/relations/categories-to-file-storage-module-widgets/frontend/component";
import { Component as WidgetsToCategories } from "@sps/ecommerce/relations/widgets-to-categories/frontend/component";

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
            categoriesToProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <CategoriesToProducts
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
            categoriesToFileStorageModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <CategoriesToFileStorageModuleWidgets
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
