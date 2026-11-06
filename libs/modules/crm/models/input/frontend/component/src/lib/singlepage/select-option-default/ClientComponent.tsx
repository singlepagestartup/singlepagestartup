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
        "flex w-full min-w-0 flex-col gap-2 [&_label]:text-sm [&_label]:font-medium [&_input]:min-h-11 [&_input]:rounded-xl [&_input]:bg-card [&_textarea]:min-h-28 [&_textarea]:rounded-xl [&_textarea]:bg-card [&_button]:min-h-11 [&_button]:rounded-xl [&_button]:bg-card",
        props.data.className,
        props.className,
      )}
    />
  );
}
