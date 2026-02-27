import { ReactNode } from "react";

export interface IComponentProps {
  className?: string;
  isServer?: boolean;
  adminBasePath: string;
  isSettingsView: boolean;
  children?: ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
