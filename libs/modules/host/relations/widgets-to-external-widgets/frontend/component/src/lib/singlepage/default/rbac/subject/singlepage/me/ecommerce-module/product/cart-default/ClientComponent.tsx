"use client";
import "client-only";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        console.log("🚀 ~ Component ~ subject:", subject);

        if (!subject) {
          return <></>;
        }

        return (
          <RbacModuleSubject
            isServer={false}
            variant="ecommerce-module-product-cart-default"
            data={subject}
            product={props.product}
            store={props.store}
            language={props.language}
            className={props.className}
          />
        );
      }}
    </RbacModuleSubject>
  );
}
