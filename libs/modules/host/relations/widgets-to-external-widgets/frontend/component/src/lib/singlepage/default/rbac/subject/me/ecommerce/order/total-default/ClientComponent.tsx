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
          <RbacModuleSubject
            isServer={false}
            variant="ecommerce-module-order-total-default"
            data={subject}
            language={props.language}
            className="w-fit"
          ></RbacModuleSubject>
        );
      }}
    </RbacModuleSubject>
  );
}
