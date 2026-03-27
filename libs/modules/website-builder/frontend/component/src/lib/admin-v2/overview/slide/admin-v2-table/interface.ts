import { ISpsComponentBase } from "@sps/ui-adapter";

export interface IComponentProps extends ISpsComponentBase {
  variant: "admin-v2-table";
  url: string;
}

export interface IComponentPropsExtended extends IComponentProps {}
