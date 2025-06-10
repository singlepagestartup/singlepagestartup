"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";
import { Component as Input } from "../input";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentProps) {
  return (
    <FormField
      control={props.form.control}
      name={props.name}
      render={({ field }) => {
        return (
          <FormItem className={cn("w-full flex flex-col", props.className)}>
            <Input
              field={field}
              {...props}
              className={cn("order-2 w-full", props.inputClassName)}
            />
            {props.label && props.type !== "checkbox" ? (
              <div
                className={cn(
                  "flex items-center order-1 w-full",
                  props.labelContainerClassName,
                )}
              >
                <FormLabel className={props.labelClassName}>
                  {props.label}
                </FormLabel>
                {props.children}
              </div>
            ) : null}
            {props.label && props.type === "checkbox" ? (
              <FormLabel className={cn("w-full order-3", props.labelClassName)}>
                {props.label}
              </FormLabel>
            ) : null}
            <FormMessage className={cn("order-4", props.messageClassName)} />
          </FormItem>
        );
      }}
    />
  );
}
