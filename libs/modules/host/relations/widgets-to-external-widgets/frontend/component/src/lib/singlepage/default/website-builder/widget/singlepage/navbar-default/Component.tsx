import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <RbacSubject
        isServer={false}
        language={props.language}
        variant="me-ecommerce-module-cart-default"
      />
      <RbacSubject
        isServer={false}
        language={props.language}
        variant="me-account"
      />
    </div>
  );
}
