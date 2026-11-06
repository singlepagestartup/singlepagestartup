"use client";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import { route } from "@sps/rbac/models/subject/sdk/model";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const permission = {
    route: "/api/rbac/roles",
    method: "GET",
    type: "HTTP" as const,
  };
  return (
    <RbacModuleSubject
      isServer={false}
      variant="authentication-is-authorized-wrapper-default"
      fallback={null}
      skeleton={null}
      apiProps={{
        params: { permission },
        mute: true,
        reactQueryOptions: {
          queryKey: [
            `${route}/authentication/is-authorized`,
            props.subjectId,
            permission,
          ],
          retry: false,
        },
      }}
    >
      {props.children}
    </RbacModuleSubject>
  );
}
