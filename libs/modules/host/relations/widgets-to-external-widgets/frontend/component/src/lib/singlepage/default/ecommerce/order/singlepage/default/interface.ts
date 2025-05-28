import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/order/sdk/model";
import { ReactNode } from "react";

export type IComponentProps = ISpsComponentBase & {
  language: string;
  data: IModel;
  variant: "default";
  children?: ReactNode;
};
