import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { ReactNode } from "react";
export const variant = "subject-me-ecommerce-module-catalogue-admin" as const;
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  children: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {
  subjectId: string;
}
