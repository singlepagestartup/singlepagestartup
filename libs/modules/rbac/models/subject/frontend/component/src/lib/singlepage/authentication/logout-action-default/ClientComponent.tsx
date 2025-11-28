"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { api } from "@sps/rbac/models/subject/sdk/client";

export function Component(props: IComponentPropsExtended) {
  const logout = api.authenticationLogout({});

  useEffect(() => {
    logout.mutate({
      redirectTo: "/",
    });
  }, []);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex flex-col w-full", props.className)}
    ></div>
  );
}
