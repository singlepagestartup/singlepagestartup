"use client";

import type { IClientComponentProps } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { FormField } from "@sps/ui-adapter";

export function Component(props: IClientComponentProps) {
  return (
    <FormField
      ui="shadcn"
      data-module="crm"
      data-model="input"
      type="select"
      label={props.data.label?.[props.language] ?? props.data.label?.en ?? ""}
      name={`${props.path}option`}
      form={props.form}
      disabled={props.disabled}
      required={
        props.data.isRequired
          ? props.language === "ru"
            ? "Заполните поле"
            : "This field is required."
          : false
      }
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      placeholder={
        props.data.placeholder?.[props.language] ??
        props.data.placeholder?.en ??
        ""
      }
      options={props.options}
      className={cn(
        "flex w-full flex-col",
        props.data.className,
        props.className,
      )}
    />
  );
}
