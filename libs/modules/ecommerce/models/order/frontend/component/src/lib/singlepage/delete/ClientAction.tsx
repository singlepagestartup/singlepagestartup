"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { api } from "@sps/ecommerce/models/order/sdk/client";
import { useEffect } from "react";
import { Button } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  const deleteEntity = api.delete();

  useEffect(() => {
    if (deleteEntity.isSuccess && typeof props.successCallback === "function") {
      props.successCallback(deleteEntity.data);
    }
  }, [deleteEntity.isSuccess]);

  return (
    <div
      data-module="ecommerce"
      data-model="order"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Button
        variant="destructive"
        onClick={() => {
          deleteEntity.mutate({
            id: props.data.id,
          });
        }}
      >
        Delete
      </Button>
    </div>
  );
}
