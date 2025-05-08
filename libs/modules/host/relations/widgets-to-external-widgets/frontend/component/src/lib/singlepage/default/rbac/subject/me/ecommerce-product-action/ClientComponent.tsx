"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { SelectSeparator } from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <div className="w-full flex flex-col gap-4">
            <RbacModuleSubject
              isServer={false}
              variant="ecommerce-module-product-checkout"
              data={subject}
              product={props.product}
              language={props.language}
              store={props.store}
            />
            <SelectSeparator className="my-2" />
            <RbacModuleSubject
              isServer={false}
              variant="ecommerce-module-product-cart"
              data={subject}
              product={props.product}
              store={props.store}
            />
          </div>
        );
      }}
    </RbacModuleSubject>
  );
}
