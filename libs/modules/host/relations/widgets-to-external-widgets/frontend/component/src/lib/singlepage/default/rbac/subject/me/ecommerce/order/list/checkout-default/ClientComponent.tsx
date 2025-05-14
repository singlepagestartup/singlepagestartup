"use client";

import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <div className="w-fit flex flex-row items-center gap-2 p-5 bg-red-300">
            <RbacModuleSubject
              isServer={false}
              variant="ecommerce-module-order-list-checkout-default"
              data={subject}
              language={props.language}
              className="w-fit"
            ></RbacModuleSubject>
          </div>
        );
      }}
    </RbacModuleSubject>
  );
}
