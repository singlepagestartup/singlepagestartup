"use client";

import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceModuleStoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { useState } from "react";
import {
  secondaryClass,
  storeList,
} from "../../../../../subject-me-crm-module-store-workspace/primitives";
import type { IStoreSectionContentProps } from "../StoreSection";

export function StorefrontProducts({
  ecommerceModuleStore,
  language,
}: Pick<IStoreSectionContentProps, "ecommerceModuleStore" | "language">) {
  const ru = language === "ru";
  const pageSize = 20;
  const [offset, setOffset] = useState(0);
  return (
    <section
      className={storeList.panel}
      aria-labelledby="storefront-products-title"
    >
      <h1 id="storefront-products-title" className={storeList.title}>
        {ru ? "Товары магазина" : "Store products"}
      </h1>
      <EcommerceModuleStoresToProducts
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            offset,
            limit: pageSize + 1,
            orderBy: { and: [{ column: "id", method: "asc" }] },
            filters: {
              and: [
                { column: "variant", method: "eq", value: "default" },
                {
                  column: "storeId",
                  method: "eq",
                  value: ecommerceModuleStore.id,
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          const ids = [
            ...new Set(
              data?.slice(0, pageSize).map(({ productId }) => productId),
            ),
          ];
          const hasNext = (data?.length ?? 0) > pageSize;
          return (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {ids.map((productId) => (
                  <EcommerceModuleProduct
                    key={productId}
                    isServer={false}
                    variant="find"
                    apiProps={{
                      params: {
                        filters: {
                          and: [
                            { column: "id", method: "eq", value: productId },
                          ],
                        },
                      },
                    }}
                  >
                    {({ data: products }) =>
                      products?.map((product) => (
                        <Subject
                          key={product.id}
                          isServer={false}
                          variant="me-ecommerce-module-product-card-default"
                          ecommerceModuleProduct={product}
                          ecommerceModuleStore={ecommerceModuleStore}
                          language={language}
                        />
                      ))
                    }
                  </EcommerceModuleProduct>
                ))}
              </div>
              {!ids.length && (
                <p className="text-sm text-muted-foreground">
                  {ru ? "Товары не найдены." : "No products found."}
                </p>
              )}
              {(offset > 0 || hasNext) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondaryClass}
                    disabled={offset === 0}
                    onClick={() => setOffset((value) => value - pageSize)}
                  >
                    {ru ? "Предыдущая страница" : "Previous page"}
                  </button>
                  <button
                    type="button"
                    className={secondaryClass}
                    disabled={!hasNext}
                    onClick={() => setOffset((value) => value + pageSize)}
                  >
                    {ru ? "Следующая страница" : "Next page"}
                  </button>
                </div>
              )}
            </>
          );
        }}
      </EcommerceModuleStoresToProducts>
    </section>
  );
}
