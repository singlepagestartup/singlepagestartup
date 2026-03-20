"use client";

import { Component as ParentComponent } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as WidgetsToProducts } from "@sps/ecommerce/relations/widgets-to-products/frontend/component";
import { Component as ProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component";
import { Component as ProductsToWebsiteBuilderModuleWidgets } from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as FileStorageFile } from "@sps/file-storage/models/file/frontend/component";
import { Component as WebsiteBuilderWidget } from "@sps/website-builder/models/widget/frontend/component";
import { IComponentProps } from "./interface";
import { Component as Product } from "../";
import { Component as Attribute } from "../../attribute";
import { Component as Widget } from "../../widget";
import { Component as Category } from "../../category";
import { Component as Store } from "../../store";
import { Component as Order } from "../../order";

export function Component(props: IComponentProps) {
  return (
    <ParentComponent
      isServer={false}
      data={props.data}
      variant="admin-v2-form"
      productsToAttributes={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProductsToAttributes
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Product"
            rightModelAdminFormLabel="Attribute"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Attribute
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.attributeId } as any}
                />
              );
            }}
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
      widgetsToProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <WidgetsToProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Widget"
            rightModelAdminFormLabel="Product"
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
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
                />
              );
            }}
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
      productsToFileStorageModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProductsToFileStorageModuleFiles
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Product"
            rightModelAdminFormLabel="File"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
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
      productsToWebsiteBuilderModuleWidgets={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <ProductsToWebsiteBuilderModuleWidgets
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Product"
            rightModelAdminFormLabel="Widget"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
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
      categoriesToProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <CategoriesToProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Category"
            rightModelAdminFormLabel="Product"
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
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
                />
              );
            }}
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
      storesToProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <StoresToProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Store"
            rightModelAdminFormLabel="Product"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Store
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.storeId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
                />
              );
            }}
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
      ordersToProducts={({ data }) => {
        if (!data) {
          return;
        }

        return (
          <OrdersToProducts
            isServer={false}
            variant="admin-v2-table"
            leftModelAdminFormLabel="Order"
            rightModelAdminFormLabel="Product"
            leftModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Order
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.orderId } as any}
                />
              );
            }}
            rightModelAdminForm={({ data }) => {
              if (!data) {
                return;
              }

              return (
                <Product
                  isServer={false}
                  variant="admin-v2-form"
                  data={{ id: data.productId } as any}
                />
              );
            }}
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
}
