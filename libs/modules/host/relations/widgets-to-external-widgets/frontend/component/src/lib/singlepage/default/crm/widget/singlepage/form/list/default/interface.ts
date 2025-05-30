import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/crm/models/widget/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  language: string;
  url: string;
  variant: string;
  data: IModel;
};
