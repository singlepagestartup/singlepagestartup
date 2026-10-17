import type { IHostRecord } from "./singlepage/composition/HostRecords/state/interface";
export interface IModel extends IHostRecord {
  adminTitle: string;
  title: string;
  url: string;
  description: string | null;
  language: string;
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

export type { ILoginPageProps } from "./singlepage/rbac-module-subject-me-authentication-select-method-ai-chat/interface";
