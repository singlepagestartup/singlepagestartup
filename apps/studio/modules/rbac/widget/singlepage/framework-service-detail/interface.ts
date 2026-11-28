export const variant = "framework-service-detail" as const;
import type { ReactNode } from "react";
import type { IFrameworkService } from "../framework-service-list/interface";

export interface IComponentProps {
  variant?: typeof variant;
  language?: "en" | "ru";
  service?: IFrameworkService;
  backHref?: string;
  backTarget?: "_top";
  booking?: ReactNode;
}
export interface IComponentPropsExtended extends IComponentProps {}
