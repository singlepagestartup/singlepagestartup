import Link from "next/link";
import { ComponentType, ReactNode, createElement } from "react";

import { api as billingCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as ecommerceAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import type { IModel as EcommerceAttributeModel } from "@sps/ecommerce/models/attribute/sdk/model";
import { api as ecommerceAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as ecommerceCategoryApi } from "@sps/ecommerce/models/category/sdk/server";
import type { IModel as EcommerceCategoryModel } from "@sps/ecommerce/models/category/sdk/model";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import type { IModel as EcommerceProductModel } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as EcommerceWidgetModel } from "@sps/ecommerce/models/widget/sdk/model";
import { api as attributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as attributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";
import { api as categoriesToProductsApi } from "@sps/ecommerce/relations/categories-to-products/sdk/server";
import { api as categoriesToWebsiteBuilderModuleWidgetsApi } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/server";
import { api as productsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as productsToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialProfilesToEcommerceModuleProductsApi } from "@sps/social/relations/profiles-to-ecommerce-module-products/sdk/server";
import { internationalization } from "@sps/shared-configuration";
import { cn } from "@sps/shared-frontend-client-utils";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";
import { saveLanguageContext } from "@sps/shared-utils";

import { Component as BillingCurrencySymbolComponent } from "@sps/billing/models/currency/frontend/component/src/lib/singlepage/symbol/Component";
import { Component as EcommerceCategoryButtonDefaultComponent } from "@sps/ecommerce/models/category/frontend/component/src/lib/singlepage/button-default/Component";
import { Component as EcommerceProductListDefaultComponent } from "@sps/ecommerce/models/widget/frontend/component/src/lib/singlepage/product/list-default/Component";
import { Component as FileStorageFileDefaultComponent } from "@sps/file-storage/models/file/frontend/component/src/lib/singlepage/default/Component";
import { Component as SocialProfileButtonDefaultComponent } from "@sps/social/models/profile/frontend/component/src/lib/singlepage/button-default/Component";

import { RouteRenderContext } from "../types";
import { warnSiteRuntime } from "../warnings";
import { byOrderIndex, findById, findByIds, findEntities } from "./shared";
import { renderWebsiteBuilderWidgetById } from "./website-builder";

function entityClassName(entity: unknown) {
  return (entity as { className?: string | null }).className || undefined;
}

async function renderProductFiles(
  productId: string,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(productsToFileStorageModuleFilesApi, [
      {
        column: "productId",
        method: "eq",
        value: productId,
      },
      {
        column: "variant",
        method: "eq",
        value: "default",
      },
    ])
  ).sort(byOrderIndex);

  return Promise.all(
    relations.map(async (relation) => {
      const file = await findById(
        fileStorageFileApi,
        relation.fileStorageModuleFileId,
      );

      if (!file?.id) {
        return null;
      }

      return (
        <div
          key={relation.id || `${productId}-${file.id}`}
          data-module="ecommerce"
          data-relation="products-to-file-storage-module-files"
          data-id={relation.id || ""}
          data-variant={relation.variant}
          className={cn("w-full flex", entityClassName(relation))}
        >
          {createElement(
            FileStorageFileDefaultComponent as ComponentType<any>,
            {
              data: file,
              isServer: true,
              language: context.language,
              variant: file.variant,
            },
          )}
        </div>
      );
    }),
  );
}

async function renderAttributeCurrencies(
  attributeId: string,
): Promise<ReactNode[]> {
  const relations = (
    await findEntities(attributesToBillingModuleCurrenciesApi, [
      {
        column: "attributeId",
        method: "eq",
        value: attributeId,
      },
    ])
  ).sort(byOrderIndex);

  const currencies = await findByIds(
    billingCurrencyApi,
    relations.map((relation) => relation.billingModuleCurrencyId),
  );
  const currenciesById = new Map(
    currencies.map((currency) => [currency.id, currency]),
  );

  return relations
    .map((relation) => {
      const currency = currenciesById.get(relation.billingModuleCurrencyId);

      if (!currency) {
        return null;
      }

      return (
        <div
          key={relation.id || `${attributeId}-${currency.id}`}
          data-module="ecommerce"
          data-relation="attributes-to-billing-module-currencies"
          data-id={relation.id || ""}
          data-variant={relation.variant}
          className={cn("w-full flex", entityClassName(relation))}
        >
          {createElement(BillingCurrencySymbolComponent as ComponentType<any>, {
            data: currency,
            isServer: true,
            variant: "symbol",
          })}
        </div>
      );
    })
    .filter(Boolean) as ReactNode[];
}

function renderAttributeValue(
  attribute: EcommerceAttributeModel,
  field: string | undefined,
  context: RouteRenderContext,
) {
  if (!field) {
    return null;
  }

  const value = (attribute as Record<string, unknown>)[field];

  if (field === "string" && value && typeof value === "object") {
    const localizedValue = (value as Record<string, string | undefined>)[
      context.language
    ];

    return localizedValue ? <p>{localizedValue}</p> : null;
  }

  if (value === undefined || value === null || value === "") {
    return null;
  }

  return <p>{String(value)}</p>;
}

async function renderProductAttributes(
  productId: string,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(productsToAttributesApi, [
      {
        column: "productId",
        method: "eq",
        value: productId,
      },
    ])
  ).sort(byOrderIndex);

  return Promise.all(
    relations.map(async (relation) => {
      const [attribute, attributeKeyRelations] = await Promise.all([
        findById(ecommerceAttributeApi, relation.attributeId),
        findEntities(attributeKeysToAttributesApi, [
          {
            column: "attributeId",
            method: "eq",
            value: relation.attributeId,
          },
        ]),
      ]);

      if (!attribute?.id) {
        return null;
      }

      const orderedAttributeKeyRelations =
        attributeKeyRelations.sort(byOrderIndex);
      const attributeKeys = await findByIds(
        ecommerceAttributeKeyApi,
        orderedAttributeKeyRelations.map(
          (attributeKeyRelation) => attributeKeyRelation.attributeKeyId,
        ),
      );
      const attributeKeysById = new Map(
        attributeKeys.map((attributeKey) => [attributeKey.id, attributeKey]),
      );
      const currencyNodes = await renderAttributeCurrencies(attribute.id);

      return (
        <div key={relation.id || `${productId}-${attribute.id}`}>
          {orderedAttributeKeyRelations.map((attributeKeyRelation) => {
            const attributeKey = attributeKeysById.get(
              attributeKeyRelation.attributeKeyId,
            );

            if (!attributeKey) {
              return null;
            }

            return (
              <div
                key={
                  attributeKeyRelation.id ||
                  `${attribute.id}-${attributeKey.id}`
                }
                className="w-fit flex gap-2"
              >
                <div
                  data-module="ecommerce"
                  data-model="attribute-key"
                  data-id={attributeKey.id || ""}
                  data-variant={attributeKey.variant}
                  className="w-fit flex gap-2"
                >
                  <p className="font-bold">
                    {attributeKey.title?.[context.language]}
                  </p>
                </div>
                <div
                  data-module="ecommerce"
                  data-model="attribute"
                  data-id={attribute.id || ""}
                  data-variant={attribute.variant}
                  className="w-fit flex flex-row gap-0.5"
                >
                  {renderAttributeValue(attribute, attributeKey.field, context)}
                  {currencyNodes}
                </div>
              </div>
            );
          })}
        </div>
      );
    }),
  );
}

async function renderProductCategoryButtons(
  productId: string,
  context: RouteRenderContext,
) {
  const relations = (
    await findEntities(categoriesToProductsApi, [
      {
        column: "productId",
        method: "eq",
        value: productId,
      },
    ])
  ).sort(byOrderIndex);

  const categories = await findByIds(
    ecommerceCategoryApi,
    relations.map((relation) => relation.categoryId),
  );
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );

  const nodes = relations
    .map((relation) => {
      const category = categoriesById.get(relation.categoryId);

      if (!category) {
        return null;
      }

      return createElement(
        EcommerceCategoryButtonDefaultComponent as ComponentType<any>,
        {
          data: category,
          isServer: true,
          key: relation.id || `${productId}-${category.id}`,
          language: context.language,
          variant: "button-default",
        },
      );
    })
    .filter(Boolean);

  if (!nodes.length) {
    return null;
  }

  return <div className="flex flex-wrap gap-2 pb-2">{nodes}</div>;
}

async function renderSocialProfileButtons(
  productId: string,
  context: RouteRenderContext,
) {
  const relations = await findEntities(
    socialProfilesToEcommerceModuleProductsApi,
    [
      {
        column: "ecommerceModuleProductId",
        method: "eq",
        value: productId,
      },
    ],
  );
  const profiles = await findByIds(
    socialProfileApi,
    relations.map((relation) => relation.profileId),
  );
  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );

  return relations.map((relation) => {
    const profile = profilesById.get(relation.profileId);

    if (!profile) {
      return null;
    }

    const href = saveLanguageContext(
      `/social/profiles/${profile.slug}`,
      context.language,
      internationalization.languages,
    );

    return (
      <Link
        href={href}
        key={relation.id || `${productId}-${profile.id}`}
        className="w-fit flex items-center"
      >
        {createElement(
          SocialProfileButtonDefaultComponent as ComponentType<any>,
          {
            data: profile,
            isServer: true,
            language: context.language,
            variant: "button-default",
          },
        )}
      </Link>
    );
  });
}

async function renderCategoryCard(
  category: EcommerceCategoryModel,
  context: RouteRenderContext,
) {
  const widgetRelations = (
    await findEntities(categoriesToWebsiteBuilderModuleWidgetsApi, [
      {
        column: "categoryId",
        method: "eq",
        value: category.id,
      },
      {
        column: "variant",
        method: "eq",
        value: "default",
      },
    ])
  ).sort(byOrderIndex);

  const widgetNodes = await Promise.all(
    widgetRelations.map(async (relation) => {
      const widgetNode = await renderWebsiteBuilderWidgetById(
        relation.websiteBuilderModuleWidgetId,
        context,
      );

      if (!widgetNode) {
        return null;
      }

      return (
        <div
          key={
            relation.id ||
            `${category.id}-${relation.websiteBuilderModuleWidgetId}`
          }
        >
          {widgetNode}
        </div>
      );
    }),
  );

  const href = saveLanguageContext(
    `/ecommerce/categories/${category.slug}`,
    context.language,
    internationalization.languages,
  );

  return (
    <Link
      data-module="ecommerce"
      data-model="category"
      data-id={category.id || ""}
      data-variant={category.variant}
      href={href}
      className={cn(
        "flex flex-col w-full cursor-pointer",
        entityClassName(category),
      )}
    >
      <Card className="w-full flex flex-col hover:border-primary duration-300">
        <CardHeader className="flex flex-col gap-1">
          {category.title?.[context.language] ? (
            <CardTitle className="font-bold lg:text-2xl">
              {category.title[context.language]}
            </CardTitle>
          ) : null}
        </CardHeader>
        <CardContent>
          {category.subtitle?.[context.language] ? (
            <TipTap
              value={category.subtitle[context.language] || ""}
              className="prose:text-secondary"
            />
          ) : null}
          {widgetNodes}
        </CardContent>
        <CardFooter>
          <Button variant="outline">
            <p>More</p>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

async function renderProductCard(
  product: EcommerceProductModel,
  context: RouteRenderContext,
) {
  const [categoryButtons, socialButtons, productFiles, attributeGroups] =
    await Promise.all([
      renderProductCategoryButtons(product.id, context),
      renderSocialProfileButtons(product.id, context),
      renderProductFiles(product.id, context),
      renderProductAttributes(product.id, context),
    ]);

  const href = saveLanguageContext(
    `/ecommerce/products/${product.slug}`,
    context.language,
    internationalization.languages,
  );

  return (
    <Card
      data-module="ecommerce"
      data-model="product"
      data-id={product.id || ""}
      data-variant={product.variant}
      className={cn(
        "w-full flex flex-col justify-between",
        entityClassName(product),
      )}
    >
      {categoryButtons ? (
        <CardHeader className="pb-0">{categoryButtons}</CardHeader>
      ) : null}
      <CardHeader>
        <CardTitle>
          <Link href={href} className="w-fit">
            {product.title?.[context.language]}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full flex flex-col mt-auto gap-2">
        {productFiles}
        {product.shortDescription?.[context.language] ? (
          <p className="text-sm text-muted-foreground">
            {product.shortDescription[context.language]}
          </p>
        ) : null}
        {attributeGroups}
      </CardContent>
      {socialButtons?.length ? (
        <CardContent>{socialButtons}</CardContent>
      ) : null}
      <CardFooter className="w-full flex flex-col"></CardFooter>
    </Card>
  );
}

async function renderCategoryListWidget(
  widget: EcommerceWidgetModel,
  context: RouteRenderContext,
) {
  const categories = await findEntities(ecommerceCategoryApi, []);
  const categoryNodes = await Promise.all(
    categories.map(async (category) => {
      const categoryNode = await renderCategoryCard(category, context);

      if (!categoryNode) {
        return null;
      }

      return <div key={category.id}>{categoryNode}</div>;
    }),
  );

  return (
    <div
      data-module="ecommerce"
      data-model="widget"
      data-id={widget.id || ""}
      data-variant={widget.variant}
      className={cn("w-full flex flex-col", entityClassName(widget))}
    >
      <div className="w-full max-w-7xl mx-auto">
        <Card className="w-full flex flex-col gap-3">
          <CardHeader>
            {widget.title?.[context.language] ? (
              <CardTitle>{widget.title[context.language]}</CardTitle>
            ) : null}
            {widget.description?.[context.language] ? (
              <TipTap value={widget.description[context.language] || ""} />
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-12">{categoryNodes}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function renderProductListWidget(
  widget: EcommerceWidgetModel,
  context: RouteRenderContext,
) {
  const products = await findEntities(ecommerceProductApi, []);
  const productNodes = await Promise.all(
    products.map(async (product) => {
      const productNode = await renderProductCard(product, context);

      if (!productNode) {
        return null;
      }

      return <div key={product.id}>{productNode}</div>;
    }),
  );

  return createElement(
    EcommerceProductListDefaultComponent as ComponentType<any>,
    {
      children: <div className="grid lg:grid-cols-2 gap-4">{productNodes}</div>,
      data: widget,
      isServer: true,
      language: context.language,
      variant: widget.variant,
    },
  );
}

export async function renderEcommerceWidget(
  widget: EcommerceWidgetModel,
  context: RouteRenderContext,
) {
  switch (widget.variant) {
    case "category-list-default":
      return renderCategoryListWidget(widget, context);
    case "product-list-default":
      return renderProductListWidget(widget, context);
    default:
      warnSiteRuntime(
        `Unsupported direct ecommerce widget variant "${widget.variant}" for widget "${widget.id}".`,
      );
      return null;
  }
}
