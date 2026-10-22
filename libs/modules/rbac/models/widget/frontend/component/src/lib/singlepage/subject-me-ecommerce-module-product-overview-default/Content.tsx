import { Component as CollectionSkeleton } from "./Skeleton";
import { notFound } from "next/navigation";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  const data = props.ecommerceModuleProductSlug;
  if (!data) return null;
  return (
    <EcommerceModuleProduct
      isServer={props.isServer}
      variant="find"
      skeleton={<CollectionSkeleton />}
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: data,
              },
            ],
          },
        },
      }}
    >
      {({ data: products }) => {
        if (products?.length === 0) notFound();
        return products?.map((product) => {
          return (
            <Subject
              key={product.id}
              isServer={false}
              variant="me-ecommerce-module-product-overview-default"
              ecommerceModuleProduct={product}
              language={props.language}
            />
          );
        });
      }}
    </EcommerceModuleProduct>
  );
}
