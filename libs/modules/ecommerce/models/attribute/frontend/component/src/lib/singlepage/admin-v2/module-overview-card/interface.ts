import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";

export const variant = "admin-v2-module-overview-card" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  href: string;
  header?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
