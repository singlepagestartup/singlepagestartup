"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";
import { useEffect } from "react";

export function Component(props: IComponentPropsExtended) {
  useEffect(() => {
    props.form.setValue(props.name, props.data[props.field] || 0);
  }, [props.data, props.name, props.field]);

  return (
    <FormField
      ui="shadcn"
      type={props.type || "text"}
      name={props.name}
      form={props.form}
      placeholder={props.placeholder}
      data-module="ecommerce"
      data-relation="orders-to-products"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    />
  );
}
