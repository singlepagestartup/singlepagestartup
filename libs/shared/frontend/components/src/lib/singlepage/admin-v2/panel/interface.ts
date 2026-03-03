import { ReactNode } from "react";

export interface IComponentProps {
  className?: string;
  isServer?: boolean;
  showSettingsButton?: boolean;
  children?: ReactNode;
  onOpenSettings?: () => void;
  settingsHref?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
