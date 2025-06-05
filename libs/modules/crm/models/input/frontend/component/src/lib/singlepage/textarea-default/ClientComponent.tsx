"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";

export function Component(props: IComponentPropsExtended) {
  return (
    <FormField
      ui="shadcn"
      data-module="crm"
      data-model="input"
      type="textarea"
      label={props.data.label?.[props.language] ?? ""}
      name={props.data.slug ?? ""}
      form={props.form}
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      placeholder={props.data.placeholder?.[props.language] ?? ""}
      className={cn(
        "flex w-full flex-col",
        props.data.className,
        props.className,
      )}
    />
  );
}
