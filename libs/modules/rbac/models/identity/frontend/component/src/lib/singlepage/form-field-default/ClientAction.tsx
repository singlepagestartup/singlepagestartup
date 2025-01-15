"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended } from "./interface";
import { FormField } from "@sps/ui-adapter";
import { useEffect } from "react";

export function Component(props: IComponentPropsExtended) {
  useEffect(() => {
    if (props.data[props.field] && props.fill) {
      props.form.setValue(props.field, props.data[props.field]);
    }
  }, [props.data]);

  return (
    <div
      data-module="rbac"
      data-model="identity"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <FormField
        ui="shadcn"
        type={props.type}
        label={props.field.charAt(0).toUpperCase() + props.field.slice(1)}
        name={props.field}
        form={props.form}
        placeholder={`Enter ${props.field}`}
      />
    </div>
  );
}
