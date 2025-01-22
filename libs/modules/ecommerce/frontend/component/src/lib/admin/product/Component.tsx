"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as ProductsToFileStorageModuleWidgets } from "@sps/ecommerce/relations/products-to-file-storage-module-widgets/frontend/component";
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
            productsToAttributes={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProductsToAttributes
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "productId",
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
                            column: "productId",
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
            productsToFileStorageModuleWidgets={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <ProductsToFileStorageModuleWidgets
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "productId",
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
                            column: "productId",
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
            storesToProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <StoresToProducts
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "productId",
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
            ordersToProducts={({ data, isServer }) => {
              if (!data) {
                return;
              }

              return (
                <OrdersToProducts
                  isServer={isServer}
                  variant="admin-table"
                  apiProps={{
                    params: {
                      filters: {
                        and: [
                          {
                            column: "productId",
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
