import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/product/sdk/model";

export type IComponentProps = ISpsComponentBase & {
  language: string;
  data: IModel;
  variant: "default";
};
