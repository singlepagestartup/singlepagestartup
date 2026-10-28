import { Component as CollectionSkeleton } from "./Skeleton";
import { notFound } from "next/navigation";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { CardContent, CardHeader } from "@sps/shared-ui-shadcn";
import { Component as Category } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Category";
import { Component as Profile } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/me/ecommerce-module/product/card-default/Profile";
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
            <EcommerceModuleProduct
              key={product.id}
              isServer={props.isServer}
              variant="overview-default"
              dataSource="props"
              data={product}
              language={props.language}
              topSlot={
                <CardHeader className="pb-0">
                  <Category
                    isServer={props.isServer}
                    language={props.language}
                    variant="overview-default"
                    ecommerceModuleProduct={product}
                  />
                </CardHeader>
              }
              middleSlot={
                <CardContent>
                  <Profile
                    isServer={props.isServer}
                    language={props.language}
                    variant="overview-default"
                    ecommerceModuleProduct={product}
                  />
                </CardContent>
              }
            >
              <div className="flex w-full flex-col gap-4">
                <Subject
                  isServer={false}
                  variant="me-ecommerce-module-product-cart-default"
                  ecommerceModuleProduct={product}
                  language={props.language}
                />
                <Subject
                  isServer={false}
                  variant="me-ecommerce-module-product-checkout-default"
                  ecommerceModuleProduct={product}
                  language={props.language}
                />
              </div>
            </EcommerceModuleProduct>
          );
        });
      }}
    </EcommerceModuleProduct>
  );
}
