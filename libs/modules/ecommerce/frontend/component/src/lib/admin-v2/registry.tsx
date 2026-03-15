"use client";

import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { type ReactNode } from "react";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Attribute } from "@sps/ecommerce/models/attribute/frontend/component";
import { Component as AttributeKey } from "@sps/ecommerce/models/attribute-key/frontend/component";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";
import { Component as Order } from "@sps/ecommerce/models/order/frontend/component";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as Widget } from "@sps/ecommerce/models/widget/frontend/component";
import { Component as AttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component";
import { Component as AttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component";
import { Component as CategoriesToFileStorageModuleFiles } from "@sps/ecommerce/relations/categories-to-file-storage-module-files/frontend/component";
import { Component as CategoriesToProducts } from "@sps/ecommerce/relations/categories-to-products/frontend/component";
import { Component as CategoriesToWebsiteBuilderModuleWidgets } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/frontend/component";
import { Component as OrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/frontend/component";
import { Component as OrdersToBillingModulePaymentIntents } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/frontend/component";
import { Component as OrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/frontend/component";
import { Component as OrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/frontend/component";
import { Component as ProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/frontend/component";
import { Component as ProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component";
import { Component as ProductsToWebsiteBuilderModuleWidgets } from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/frontend/component";
import { Component as StoresToAttributes } from "@sps/ecommerce/relations/stores-to-attributes/frontend/component";
import { Component as StoresToOrders } from "@sps/ecommerce/relations/stores-to-orders/frontend/component";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as WidgetsToCategories } from "@sps/ecommerce/relations/widgets-to-categories/frontend/component";
import { Component as WidgetsToProducts } from "@sps/ecommerce/relations/widgets-to-products/frontend/component";
import { Component as WidgetsToStores } from "@sps/ecommerce/relations/widgets-to-stores/frontend/component";
import { Component as BillingModuleCurrency } from "@sps/billing/models/currency/frontend/component";
import { Component as BillingModulePaymentIntent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as FileStorageModuleFile } from "@sps/file-storage/models/file/frontend/component";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";

interface ITableProps {
  isServer: boolean;
  url: string;
}

type TEcommerceModelId =
  | "widget"
  | "product"
  | "store"
  | "category"
  | "attribute"
  | "attribute-key"
  | "order";

interface IEcommerceAdminV2ModelRegistryItem {
  id: TEcommerceModelId;
  title: string;
  Model: (props: any) => ReactNode;
  Table: (props: ITableProps) => ReactNode;
}

type TRelatedVariant = "admin-v2-form" | "admin-form";

function createRelatedAdminForm<
  T extends {
    id?: string;
  },
>(
  Component: (props: any) => ReactNode,
  field: keyof T & string,
  variant: TRelatedVariant = "admin-v2-form",
) {
  return (props: { isServer: boolean; data?: T }) => {
    const value = props.data?.[field];
    if (typeof value !== "string" || value.length === 0) {
      return null;
    }

    return (
      <Component
        isServer={props.isServer}
        variant={variant}
        data={{ id: value }}
      />
    );
  };
}

function filterBy(column: string, value?: string) {
  if (!value) {
    return undefined;
  }

  return {
    params: {
      filters: {
        and: [
          {
            column,
            method: "eq",
            value,
          },
        ],
      },
    },
  };
}

function isModelRoute(url: string, model: string) {
  return url.startsWith(`${ADMIN_BASE_PATH}/ecommerce/${model}`);
}

function ProductTable(props: ITableProps) {
  if (!isModelRoute(props.url, "product")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Product</h1>
      <Product
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(formProps) => {
          return (
            <Product
              isServer={formProps.isServer}
              data={formProps.data}
              variant="admin-v2-form"
              productsToAttributes={({ data, isServer }) => (
                <ProductsToAttributes
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{ model: "product", field: "productId" }}
                  apiProps={filterBy("productId", data?.id)}
                  relatedAdminForm={createRelatedAdminForm(
                    Attribute,
                    "attributeId",
                  )}
                />
              )}
              widgetsToProducts={({ data, isServer }) => (
                <WidgetsToProducts
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{ model: "product", field: "productId" }}
                  apiProps={filterBy("productId", data?.id)}
                  relatedAdminForm={createRelatedAdminForm(Widget, "widgetId")}
                />
              )}
              productsToFileStorageModuleWidgets={({ data, isServer }) => (
                <ProductsToFileStorageModuleFiles
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{ model: "product", field: "productId" }}
                  apiProps={filterBy("productId", data?.id)}
                  relatedAdminForm={createRelatedAdminForm(
                    FileStorageModuleFile,
                    "fileStorageModuleFileId",
                    "admin-form",
                  )}
                />
              )}
              productsToWebsiteBuilderModuleWidgets={({ data, isServer }) => (
                <ProductsToWebsiteBuilderModuleWidgets
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{ model: "product", field: "productId" }}
                  apiProps={filterBy("productId", data?.id)}
                  relatedAdminForm={createRelatedAdminForm(
                    WebsiteBuilderModuleWidget,
                    "websiteBuilderModuleWidgetId",
                    "admin-form",
                  )}
                />
              )}
              categoriesToProducts={({ data, isServer }) => (
                <CategoriesToProducts
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{ model: "product", field: "productId" }}
                  apiProps={filterBy("productId", data?.id)}
                  relatedAdminForm={createRelatedAdminForm(
                    Category,
                    "categoryId",
                  )}
                />
              )}
              storesToProducts={({ data, isServer }) => (
                <StoresToProducts
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{ model: "product", field: "productId" }}
                  apiProps={filterBy("productId", data?.id)}
                  relatedAdminForm={createRelatedAdminForm(Store, "storeId")}
                />
              )}
              ordersToProducts={({ data, isServer }) => (
                <OrdersToProducts
                  isServer={isServer}
                  variant="admin-v2-table"
                  relatedContext={{ model: "product", field: "productId" }}
                  apiProps={filterBy("productId", data?.id)}
                  relatedAdminForm={createRelatedAdminForm(Order, "orderId")}
                />
              )}
            />
          );
        }}
      />
    </div>
  );
}

function AttributeTable(props: ITableProps) {
  if (!isModelRoute(props.url, "attribute")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">
        Attribute
      </h1>
      <Attribute
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(formProps) => (
          <Attribute
            isServer={formProps.isServer}
            data={formProps.data}
            variant="admin-v2-form"
            attributeKeysToAttributes={({ data, isServer }) => (
              <AttributeKeysToAttributes
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "attribute", field: "attributeId" }}
                apiProps={filterBy("attributeId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  AttributeKey,
                  "attributeKeyId",
                )}
              />
            )}
            productsToAttributes={({ data, isServer }) => (
              <ProductsToAttributes
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "attribute", field: "attributeId" }}
                apiProps={filterBy("attributeId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Product, "productId")}
              />
            )}
            storesToAttributes={({ data, isServer }) => (
              <StoresToAttributes
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "attribute", field: "attributeId" }}
                apiProps={filterBy("attributeId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Store, "storeId")}
              />
            )}
            attributesToBillingModuleCurrencies={({ data, isServer }) => (
              <AttributesToBillingModuleCurrencies
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "attribute", field: "attributeId" }}
                apiProps={filterBy("attributeId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  BillingModuleCurrency,
                  "billingModuleCurrencyId",
                  "admin-form",
                )}
              />
            )}
          />
        )}
      />
    </div>
  );
}

function AttributeKeyTable(props: ITableProps) {
  if (!isModelRoute(props.url, "attribute-key")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">
        Attribute Key
      </h1>
      <AttributeKey
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(formProps) => (
          <AttributeKey
            isServer={formProps.isServer}
            data={formProps.data}
            variant="admin-v2-form"
            attributeKeysToAttributes={({ data, isServer }) => (
              <AttributeKeysToAttributes
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{
                  model: "attribute-key",
                  field: "attributeKeyId",
                }}
                apiProps={filterBy("attributeKeyId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  Attribute,
                  "attributeId",
                )}
              />
            )}
          />
        )}
      />
    </div>
  );
}

function CategoryTable(props: ITableProps) {
  if (!isModelRoute(props.url, "category")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Category</h1>
      <Category
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(formProps) => (
          <Category
            isServer={formProps.isServer}
            data={formProps.data}
            variant="admin-v2-form"
            categoriesToWebsiteBuilderModuleWidgets={({ data, isServer }) => (
              <CategoriesToWebsiteBuilderModuleWidgets
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "category", field: "categoryId" }}
                apiProps={filterBy("categoryId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  WebsiteBuilderModuleWidget,
                  "websiteBuilderModuleWidgetId",
                  "admin-form",
                )}
              />
            )}
            categoriesToProducts={({ data, isServer }) => (
              <CategoriesToProducts
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "category", field: "categoryId" }}
                apiProps={filterBy("categoryId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Product, "productId")}
              />
            )}
            widgetsToCategories={({ data, isServer }) => (
              <WidgetsToCategories
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "category", field: "categoryId" }}
                apiProps={filterBy("categoryId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Widget, "widgetId")}
              />
            )}
            categoriesToFileStorageModuleWidgets={({ data, isServer }) => (
              <CategoriesToFileStorageModuleFiles
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "category", field: "categoryId" }}
                apiProps={filterBy("categoryId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  FileStorageModuleFile,
                  "fileStorageModuleFileId",
                  "admin-form",
                )}
              />
            )}
          />
        )}
      />
    </div>
  );
}

function OrderTable(props: ITableProps) {
  if (!isModelRoute(props.url, "order")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Order</h1>
      <Order
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(formProps) => (
          <Order
            isServer={formProps.isServer}
            data={formProps.data}
            variant="admin-v2-form"
            ordersToProducts={({ data, isServer }) => (
              <OrdersToProducts
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "order", field: "orderId" }}
                apiProps={filterBy("orderId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Product, "productId")}
              />
            )}
            ordersToBillingModulePaymentIntents={({ data, isServer }) => (
              <OrdersToBillingModulePaymentIntents
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "order", field: "orderId" }}
                apiProps={filterBy("orderId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  BillingModulePaymentIntent,
                  "billingModulePaymentIntentId",
                  "admin-form",
                )}
              />
            )}
            ordersToBillingModuleCurrencies={({ data, isServer }) => (
              <OrdersToBillingModuleCurrencies
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "order", field: "orderId" }}
                apiProps={filterBy("orderId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  BillingModuleCurrency,
                  "billingModuleCurrencyId",
                  "admin-form",
                )}
              />
            )}
            ordersToFileStorageModuleFiles={({ data, isServer }) => (
              <OrdersToFileStorageModuleFiles
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "order", field: "orderId" }}
                apiProps={filterBy("orderId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  FileStorageModuleFile,
                  "fileStorageModuleFileId",
                  "admin-form",
                )}
              />
            )}
          />
        )}
      />
    </div>
  );
}

function StoreTable(props: ITableProps) {
  if (!isModelRoute(props.url, "store")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Store</h1>
      <Store
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(formProps) => (
          <Store
            isServer={formProps.isServer}
            data={formProps.data}
            variant="admin-v2-form"
            storesToAttributes={({ data, isServer }) => (
              <StoresToAttributes
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "store", field: "storeId" }}
                apiProps={filterBy("storeId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  Attribute,
                  "attributeId",
                )}
              />
            )}
            storesToProducts={({ data, isServer }) => (
              <StoresToProducts
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "store", field: "storeId" }}
                apiProps={filterBy("storeId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Product, "productId")}
              />
            )}
            storesToOrders={({ data, isServer }) => (
              <StoresToOrders
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "store", field: "storeId" }}
                apiProps={filterBy("storeId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Order, "orderId")}
              />
            )}
          />
        )}
      />
    </div>
  );
}

function WidgetTable(props: ITableProps) {
  if (!isModelRoute(props.url, "widget")) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-bold tracking-tight capitalize">Widget</h1>
      <Widget
        isServer={props.isServer}
        variant="admin-v2-table"
        adminForm={(formProps) => (
          <Widget
            isServer={formProps.isServer}
            data={formProps.data}
            variant="admin-v2-form"
            widgetsToCategories={({ data, isServer }) => (
              <WidgetsToCategories
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "widget", field: "widgetId" }}
                apiProps={filterBy("widgetId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(
                  Category,
                  "categoryId",
                )}
              />
            )}
            widgetsToProducts={({ data, isServer }) => (
              <WidgetsToProducts
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "widget", field: "widgetId" }}
                apiProps={filterBy("widgetId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Product, "productId")}
              />
            )}
            widgetsToStores={({ data, isServer }) => (
              <WidgetsToStores
                isServer={isServer}
                variant="admin-v2-table"
                relatedContext={{ model: "widget", field: "widgetId" }}
                apiProps={filterBy("widgetId", data?.id)}
                relatedAdminForm={createRelatedAdminForm(Store, "storeId")}
              />
            )}
          />
        )}
      />
    </div>
  );
}

export const ecommerceAdminV2Models: IEcommerceAdminV2ModelRegistryItem[] = [
  {
    id: "widget",
    title: "Widget",
    Model: Widget,
    Table: WidgetTable,
  },
  {
    id: "product",
    title: "Product",
    Model: Product,
    Table: ProductTable,
  },
  {
    id: "store",
    title: "Store",
    Model: Store,
    Table: StoreTable,
  },
  {
    id: "category",
    title: "Category",
    Model: Category,
    Table: CategoryTable,
  },
  {
    id: "attribute",
    title: "Attribute",
    Model: Attribute,
    Table: AttributeTable,
  },
  {
    id: "attribute-key",
    title: "Attribute Key",
    Model: AttributeKey,
    Table: AttributeKeyTable,
  },
  {
    id: "order",
    title: "Order",
    Model: Order,
    Table: OrderTable,
  },
];
