"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";
import { useEffect } from "react";

export function Component(props: IComponentPropsExtended) {
  useEffect(() => {
    props.form.setValue(
      props.formFieldName,
      props.data[props.entityFieldName] || "",
    );
  }, [props.data, props.formFieldName, props.entityFieldName]);

  return (
    <FormField
      ui="shadcn"
      type={props.type || "text"}
      name={props.formFieldName}
      form={props.form}
      placeholder={props.placeholder}
      data-module="ecommerce"
      data-model="order"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    />
  );
}
