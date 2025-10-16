"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";
import { ReactNode } from "react";

export function Component(
  props: IComponentPropsExtended & {
    options: [
      string,
      string,
      ReactNode | ((props: any) => ReactNode | undefined),
    ][];
  },
) {
  return (
    <FormField
      ui="shadcn"
      data-module="crm"
      data-model="input"
      type="select"
      label={props.data.label?.[props.language] ?? ""}
      name={props.data.slug ?? ""}
      form={props.form}
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      placeholder={props.data.placeholder?.[props.language] ?? ""}
      options={props.options}
      className={cn(
        "flex w-full flex-col",
        props.data.className,
        props.className,
      )}
    />
  );
}
