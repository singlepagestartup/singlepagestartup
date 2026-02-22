export type TModuleItem = {
  id: string;
  name: string;
  icon: string;
};

export type TSidebarState = {
  sidebarOpen: boolean;
  selectedModule: string;
  expandedModule: string;
  selectedModel: string;
  modelSearch: string;
};

export interface IComponentProps {
  className?: string;
  isServer?: boolean;
  showSettingsButton?: boolean;
  state: TSidebarState;
  modules: TModuleItem[];
  modelsByModule: Record<string, string[]>;
  isModuleView: boolean;
  isSettingsView: boolean;
  onSelectModule: (moduleId: string) => void;
  onSelectModel: (moduleId: string, modelName: string) => void;
  onOpenSettings: () => void;
}

export interface IComponentPropsExtended extends IComponentProps {}
