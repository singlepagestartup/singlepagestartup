"use client";

import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { SelectSeparator } from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
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
              variant="ecommerce-module-product-checkout"
              data={subject}
              product={props.product}
              billingModuleCurrencyId={props.billingModuleCurrencyId}
              language={props.language}
              store={props.store}
            />
            <SelectSeparator className="my-2" />
            <RbacSubject
              isServer={false}
              variant="ecommerce-module-product-cart"
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
