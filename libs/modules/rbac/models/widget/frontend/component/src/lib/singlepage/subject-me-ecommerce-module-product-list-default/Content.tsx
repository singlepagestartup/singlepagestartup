import { Component as CollectionSkeleton } from "./Skeleton";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  return (
    <EcommerceModuleProduct
      isServer={props.isServer}
      variant="find"
      skeleton={<CollectionSkeleton />}
    >
      {({ data }) => (
        <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data?.length === 0 ? (
            <p
              role="status"
              className="col-span-full rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground"
            >
              {props.language === "ru"
                ? "Товаров пока нет."
                : "No products yet."}
            </p>
          ) : null}
          {data?.map((product) => (
            <Subject
              key={product.id}
              isServer={false}
              variant="me-ecommerce-module-product-card-default"
              ecommerceModuleProduct={product}
              language={props.language}
            />
          ))}
        </div>
      )}
    </EcommerceModuleProduct>
  );
}
