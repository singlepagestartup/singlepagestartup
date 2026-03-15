import { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps extends ISpsComponentBase {
  modelName: string;
  apiRoute: string;
  href: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
