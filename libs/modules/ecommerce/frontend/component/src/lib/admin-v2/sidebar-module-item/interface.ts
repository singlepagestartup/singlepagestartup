export type TModuleItem = {
  id: string;
  name: string;
  icon: string;
};

export interface IComponentProps {
  moduleItem: TModuleItem;
  models: string[];
}

export interface IComponentPropsExtended extends IComponentProps {}
