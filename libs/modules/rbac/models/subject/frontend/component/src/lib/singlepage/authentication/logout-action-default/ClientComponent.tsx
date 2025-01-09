"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { useRouter } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();

  const logout = api.authenticationLogout({
    reactQueryOptions: {
      enabled: false,
    },
  });

  useEffect(() => {
    logout.refetch();
  }, []);

  useEffect(() => {
    if (logout.isSuccess) {
      router.push(props.redirectUrl || "/");
    }
  }, [logout.isSuccess]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex flex-col w-full", props.className)}
    ></div>
  );
}
