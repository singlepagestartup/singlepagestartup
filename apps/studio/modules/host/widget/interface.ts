import type { IHostRecord } from "../page/singlepage/composition/HostRecords/state/interface";
export interface IModel extends IHostRecord {
  adminTitle: string;
  title: Record<string, string> | null;
  subtitle: Record<string, string> | null;
  description: Record<string, string> | null;
  slug: string;
  className: string | null;
}

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
