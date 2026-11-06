import type { ReactNode } from "react";
import type { ISpsComponentBase } from "@sps/ui-adapter";
export const variant = "private-content-default" as const;
export type IAccessState =
  | "guest"
  | "locked"
  | "expired"
  | "granted"
  | "checking"
  | "error";
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  language: string;
  access: IAccessState;
  actionHref?: string;
  children?: ReactNode;
  onRetry?: () => void;
}
