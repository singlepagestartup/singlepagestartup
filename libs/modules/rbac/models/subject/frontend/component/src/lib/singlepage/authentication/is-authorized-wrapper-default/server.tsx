"use server";
import "server-only";

import { IComponentProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { Component } from "./Component";
import { Component as SelectMethod } from "../select-method-default";
import { cn } from "@sps/shared-frontend-client-utils";

export default async function Server(props: IComponentProps) {
  const data = await api.authenticationIsAuthorized(props.apiProps);

  if (!data) {
    return (
      <div className={cn("w-full flex flex-col", props.className)}>
        <SelectMethod
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="authentication-select-method-default"
        />
      </div>
    );
  }

  return <Component {...props} />;
}
