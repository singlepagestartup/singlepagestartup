import { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps extends ISpsComponentBase {
  className?: string;
  variant: string;
  props?: string;
  url: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
