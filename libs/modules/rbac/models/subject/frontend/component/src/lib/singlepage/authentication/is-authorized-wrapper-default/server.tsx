"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import { Component as SelectMethod } from "../select-method-default";
import { cn } from "@sps/shared-frontend-client-utils";

export default async function Server(props: IComponentProps) {
  const data = await subjectApi.authenticationIsAuthorized(props.apiProps);

  if (!data?.ok) {
    if (props.fallback !== undefined) return props.fallback;
    return (
      <div className={cn("w-full flex flex-col", props.className)}>
        <SelectMethod
          isServer={props.isServer}
          variant="authentication-select-method-default"
        />
      </div>
    );
  }

  return <ChildComponent {...props} />;
}
