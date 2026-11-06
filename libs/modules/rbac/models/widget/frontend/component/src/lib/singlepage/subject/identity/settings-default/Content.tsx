"use client";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  return (
    <RbacModuleSubject isServer={false} variant="authentication-me-default">
      {({ data }) => {
        if (!data) {
          return;
        }
        return (
          <RbacModuleSubject
            isServer={false}
            variant="identity-settings-default"
            data={data}
          />
        );
      }}
    </RbacModuleSubject>
  );
}
