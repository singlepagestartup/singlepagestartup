import { ReactNode } from "react";

export interface IComponentProps {
  className?: string;
  isServer?: boolean;
  showSettingsButton?: boolean;
  children?: ReactNode;
  isSettingsView: boolean;
  onOpenSettings: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
