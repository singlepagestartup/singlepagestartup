"use client";

import { Button } from "@sps/shared-ui-shadcn/button";
import { Component as StoreManagementTable } from "@sps/shared-frontend-components/singlepage/store-management-table";
import type { IStoreTableParams } from "@sps/shared-frontend-components/singlepage/store-management-table/interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IStoreProduct } from "@sps/rbac/models/subject/sdk/model";
import { ChevronRight, PackagePlus } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import {
  primaryClass,
  storeList,
} from "../../../../../subject-me-crm-module-store-workspace/primitives";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { storeProductHref } from "../paths";
import {
  offerVariantLabel,
  productPriceLabels,
  productKind,
  productName,
} from "./view-model";

const productColumns =
  "md:grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,1fr)_1rem]";

interface IProductRowProps {
  item: IStoreProduct;
  language: string;
  storeSlug: string;
}

const ProductRow = memo(function ProductRow({
  item,
  language,
  storeSlug,
}: IProductRowProps) {
  const ru = language === "ru";
  const { product, offers } = item;
  const offerTypes = [
    ...new Set(offers.map(({ variant }) => offerVariantLabel(variant, ru))),
  ];
  const labels = productPriceLabels(item, language);
  return (
    <li className="min-w-0">
      <Link
        className={`${storeList.row} ${productColumns} grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-x-4 gap-y-1.5 px-4 py-3 text-sm`}
        href={storeProductHref(language, storeSlug, product.id)}
        aria-labelledby={`store-product-name-${product.id}`}
        aria-describedby={`store-product-details-${product.id}`}
      >
        <span
          id={`store-product-name-${product.id}`}
          className="min-w-0 break-words font-semibold"
        >
          {productName(product, language)}
        </span>
        <span
          id={`store-product-details-${product.id}`}
          className="col-span-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground md:contents md:text-sm"
        >
          <span className="min-w-0 break-words">
            <span className="sr-only">{ru ? "Тип" : "Type"}: </span>
            {productKind(product.kind, ru)}
          </span>
          <span className="min-w-0 break-words">
            <span className="md:sr-only">
              {ru ? "Вид предложения" : "Offer type"}:{" "}
            </span>
            {offerTypes.length ? offerTypes.join(", ") : "—"}
          </span>
          <span className="min-w-0 break-words font-medium text-foreground tabular-nums">
            <span className="md:sr-only">{ru ? "Цена" : "Price"}: </span>
            {labels.length
              ? labels.map((label) => (
                  <span key={label} className="block">
                    {label}
                  </span>
                ))
              : "—"}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`${storeList.arrow} col-start-2 row-start-1 md:col-start-5`}
        />
      </Link>
    </li>
  );
});

interface IStoreProductsProps {
  subjectId: string;
  canManageCatalog: boolean;
  storeId: string;
  storeSlug: string;
  language: string;
}

export function StoreProducts({
  subjectId,
  canManageCatalog,
  storeId,
  storeSlug,
  language,
}: IStoreProductsProps) {
  const ru = language === "ru";
  function useProductsPage({ offset, limit, search }: IStoreTableParams) {
    const result = api.storeProducts.useList(
      subjectId,
      storeId,
      offset,
      limit,
      search || undefined,
    );
    return { ...result, denied: hasStatus(result.error, 401, 403) };
  }

  return (
    <StoreManagementTable
      isServer={false}
      language={language}
      title={ru ? "Товары магазина" : "Store products"}
      searchPlaceholder={
        ru ? "Название или адрес товара" : "Product name or slug"
      }
      emptyMessage={ru ? "Товаров пока нет." : "No products yet."}
      deniedMessage={
        ru
          ? "У вас нет доступа к товарам этого магазина."
          : "You do not have access to this store’s products."
      }
      usePage={useProductsPage}
      action={
        canManageCatalog && (
          <Button asChild className={primaryClass}>
            <Link href={storeProductHref(language, storeSlug, "new")}>
              <PackagePlus aria-hidden="true" className="size-4" />
              {ru ? "Добавить товар" : "Add product"}
            </Link>
          </Button>
        )
      }
      header={
        <div
          aria-hidden="true"
          className={`${productColumns} grid gap-x-4 px-4 text-xs font-medium text-muted-foreground max-md:[&>span:not(:first-child)]:hidden`}
        >
          <span>{ru ? "Товар" : "Product"}</span>
          <span>{ru ? "Тип" : "Type"}</span>
          <span>{ru ? "Вид предложения" : "Offer type"}</span>
          <span>{ru ? "Цена" : "Price"}</span>
        </div>
      }
      renderRow={(item: IStoreProduct) => (
        <ProductRow
          key={item.product.id}
          item={item}
          language={language}
          storeSlug={storeSlug}
        />
      )}
    />
  );
}
