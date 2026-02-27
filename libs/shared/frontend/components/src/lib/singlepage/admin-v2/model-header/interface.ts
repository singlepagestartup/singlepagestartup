import { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps extends ISpsComponentBase {
  moduleName: string;
  moduleHref: string;
  modelName: string;
  modelHref: string;
  className?: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
