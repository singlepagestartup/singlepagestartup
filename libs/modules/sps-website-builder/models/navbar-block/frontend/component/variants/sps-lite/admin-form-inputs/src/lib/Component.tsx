"use client";

import React from "react";
import { IComponentPropsExtended } from "./interface";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sps/shadcn";
import { variants } from "@sps/sps-website-builder-models-navbar-block-contracts";
import { Component as NavbarBlocksToButtonsSpsLiteSelectRight } from "@sps/sps-website-builder-relations-navbar-blocks-to-buttons-frontend-component-variants-sps-lite-select-right";
import { Component as NavbarBlocksToLogotypes } from "@sps/sps-website-builder-relations-navbar-blocks-to-logotypes-frontend-component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="sps-website-builder"
      data-model="navbar-block"
      data-variant={props.variant}
      className={`${props.className || ""}`}
    >
      <div className="flex flex-col gap-6">
        <FormField
          control={props.form.control}
          name="variant"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variant</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {variants.map((variant, index) => {
                    return (
                      <SelectItem key={index} value={variant}>
                        {variant}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {props.data?.navbarBlocksToButtons.map(
          (navbarBlocksToButton, index) => {
            return (
              <NavbarBlocksToButtonsSpsLiteSelectRight
                key={index}
                isServer={false}
                variant="select-right"
                data={navbarBlocksToButton}
              />
            );
          },
        )}
        <NavbarBlocksToButtonsSpsLiteSelectRight
          isServer={false}
          variant="select-right"
        />
        {props.data?.navbarBlocksToLogotypes.map(
          (navbarBlocksToLogotypes, index) => {
            return (
              <NavbarBlocksToLogotypes
                key={index}
                variant="select-right"
                isServer={false}
                data={navbarBlocksToLogotypes}
              />
            );
          },
        )}
        <NavbarBlocksToLogotypes variant="select-right" isServer={false} />
      </div>
    </div>
  );
}
