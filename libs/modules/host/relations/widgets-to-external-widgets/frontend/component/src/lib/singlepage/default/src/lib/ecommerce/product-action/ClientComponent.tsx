"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import { SelectSeparator } from "@sps/shared-ui-shadcn";

export function Component(
  props: ISpsComponentBase & {
    product: IProduct;
    billingModuleCurrencyId?: string;
  },
) {
  return (
    <RbacSubject
      isServer={false}
      hostUrl={props.hostUrl}
      variant="authentication-me-default"
    >
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <div className="w-full flex flex-col gap-4">
            <RbacSubject
              isServer={false}
              hostUrl={props.hostUrl}
              variant="ecommerce-product-checkout"
              data={subject}
              product={props.product}
              billingModuleCurrencyId={props.billingModuleCurrencyId}
            />
            <SelectSeparator className="my-2" />
            <RbacSubject
              isServer={false}
              hostUrl={props.hostUrl}
              variant="ecommerce-product-cart"
              data={subject}
              product={props.product}
            />
          </div>
        );
      }}
    </RbacSubject>
  );
}
