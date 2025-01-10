"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@sps/shared-ui-shadcn";
import { IComponentProps } from "./interface";
import { Component as Input } from "../input";

export function Component(props: IComponentProps) {
  return (
    <FormField
      control={props.form.control}
      name={props.name}
      render={({ field }) => {
        return (
          <FormItem className={props.className}>
            {props.label && props.type !== "checkbox" ? (
              <div className="flex items-center">
                <FormLabel>{props.label}</FormLabel>
                {props.children}
              </div>
            ) : null}
            <Input field={field} {...props} className={props.inputClassName} />
            {props.label && props.type === "checkbox" ? (
              <FormLabel>{props.label}</FormLabel>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
