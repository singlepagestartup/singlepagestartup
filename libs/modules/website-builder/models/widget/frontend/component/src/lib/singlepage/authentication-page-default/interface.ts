import type { ReactNode } from "react";
import type { IEmailPasswordAction } from "@sps/shared-utils";
import type { ISpsComponentBase } from "@sps/ui-adapter";

export const variant = "authentication-page-default" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  language: string;
  action: IEmailPasswordAction;
  children: ReactNode;
}
export type IComponentPropsExtended = IComponentProps;
