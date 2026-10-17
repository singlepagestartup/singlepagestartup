export type { IRecord as IModel } from "./singlepage/admin-v2-table/interface";

import type { ComponentProps } from "react";
import type { variants } from "./variants";
export type IComponentProps = {
  [Variant in keyof typeof variants]: { variant: Variant } & Omit<
    NonNullable<ComponentProps<(typeof variants)[Variant]>>,
    "variant"
  >;
}[keyof typeof variants];

export interface ISkeletonProps {
  variant?: IComponentProps["variant"];
  className?: string;
  rows?: number;
}

export type { ProductTierProps } from "./singlepage/tier/interface";

export type { ProductOverviewDefaultProps } from "./singlepage/overview-default/interface";
