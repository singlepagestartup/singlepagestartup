import { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps extends ISpsComponentBase {
  url: string;
  language: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
