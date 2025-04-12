"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { SelectSeparator } from "@sps/shared-ui-shadcn";

export function Component(
  props: ISpsComponentBase & {
    product: IProduct;
    store: IStore;
    billingModuleCurrencyId?: string;
    language: string;
  },
) {
  return (
    <RbacSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <div className="w-full flex flex-col gap-4">
            <RbacSubject
              isServer={false}
              variant="ecommerce-product-checkout"
              data={subject}
              product={props.product}
              billingModuleCurrencyId={props.billingModuleCurrencyId}
              language={props.language}
              store={props.store}
            />
            <SelectSeparator className="my-2" />
            <RbacSubject
              isServer={false}
              variant="ecommerce-product-cart"
              data={subject}
              product={props.product}
              store={props.store}
            />
          </div>
        );
      }}
    </RbacSubject>
  );
}
