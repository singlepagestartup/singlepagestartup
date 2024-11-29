"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    product: IProduct;
  },
) {
  return (
    <RbacSubject isServer={false} hostUrl={props.hostUrl} variant="me">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <div className="flex flex-col gap-2">
            <RbacSubject
              isServer={false}
              hostUrl={props.hostUrl}
              variant="ecommerce-product-one-step-checkout"
              data={subject}
              product={props.product}
            />
            <RbacSubject
              isServer={false}
              hostUrl={props.hostUrl}
              variant="ecommerce-products-cart"
              data={subject}
              product={props.product}
            />
          </div>
        );
      }}
    </RbacSubject>
  );
}
