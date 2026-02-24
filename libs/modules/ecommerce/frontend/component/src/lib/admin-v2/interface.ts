import { ReactNode } from "react";

export interface IComponentProps {
  className?: string;
  isServer?: boolean;
  adminBasePath: string;
  isSettingsView: boolean;
  onOpenSettings: () => void;
  children: (props: {
    moduleName: string;
    moduleOverviewCards: ReactNode;
    getModelHeader: (modelName: string) => ReactNode;
  }) => ReactNode;
}

export interface IComponentPropsExtended extends IComponentProps {}
