import { ReactNode } from "react";

export interface IComponentProps {
  className?: string;
  isServer?: boolean;
  adminBasePath: string;
  children?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
