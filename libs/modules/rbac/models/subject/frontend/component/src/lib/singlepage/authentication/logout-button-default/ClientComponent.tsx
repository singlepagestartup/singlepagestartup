"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/ui-adapter";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useRouter } from "next/navigation";

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();
  const logout = api.authenticationLogout({});

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
        logout.mutate({
          redirectTo: "/",
        });
      }}
      className={cn("w-full flex flex-col", props.className)}
    >
      <p>Logout</p>
    </Button>
  );
}
