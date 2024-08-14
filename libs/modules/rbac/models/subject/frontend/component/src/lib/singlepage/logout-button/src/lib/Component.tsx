"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/ui-adapter";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useRouter } from "next/navigation";

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const logout = api.logout({
    reactQueryOptions: {
      enabled: false,
    },
  });

  useEffect(() => {
    if (logout.isSuccess) {
      router.push("/");
    }
  }, [logout.isSuccess]);

  return (
    <Button
      ui="shadcn"
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      onClick={() => {
        logout.refetch();
      }}
      className={cn("w-full py-10 text-center flex flex-col gap-1")}
    >
      <p>Logout</p>
    </Button>
  );
}