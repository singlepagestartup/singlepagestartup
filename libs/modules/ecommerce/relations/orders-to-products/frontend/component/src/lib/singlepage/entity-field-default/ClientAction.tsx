"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";
import { useEffect } from "react";

export function Component(props: IComponentPropsExtended) {
  useEffect(() => {
    const q = props.form.getValues("quantity");
    props.form.setValue("quantity", props.data?.quantity || 0);
  }, [props.data.quantity]);

  return (
    <FormField
      ui="shadcn"
      type="number"
      name={props.field}
      form={props.form}
      placeholder="Type quantity"
      data-module="ecommerce"
      data-relation="orders-to-products"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className)}
    />
  );
}
