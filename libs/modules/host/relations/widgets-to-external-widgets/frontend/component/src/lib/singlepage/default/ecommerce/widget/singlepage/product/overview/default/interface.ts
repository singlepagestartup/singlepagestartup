import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  url: string;
  language: string;
  variant: string;
  data: IModel;
};
