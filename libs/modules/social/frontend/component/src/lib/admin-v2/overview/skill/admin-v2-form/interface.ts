import { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps extends ISpsComponentBase {
  variant: "admin-v2-form";
  data?: any;
}

export interface IComponentPropsExtended extends IComponentProps {}
