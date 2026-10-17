"use client";
import { forwardRef } from "react";
import { Component as Shadcn } from "./shadcn";
import type { IComponentProps } from "./interface";

export const Select = forwardRef<HTMLButtonElement, IComponentProps>(
  function Select(props, ref) {
    return <Shadcn {...props} ref={ref} />;
  },
);
export type { IComponentProps, ISelectOption } from "./interface";
