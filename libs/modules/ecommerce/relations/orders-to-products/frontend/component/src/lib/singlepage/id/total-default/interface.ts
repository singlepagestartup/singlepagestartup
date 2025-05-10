export { type IModel } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";
import {
  type IProps,
  type IResult,
} from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { NextRequestOptions } from "@sps/shared-utils";

export const variant = "id-total-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: IModel;
  language: string;
  apiProps?: {
    params?: IProps["ITotalProps"];
    options?: Partial<NextRequestOptions>;
  };
  children?: ReactNode;
  className?: string;
}

export interface IComponentPropsExtended extends Omit<IComponentProps, "data"> {
  data: IResult["ITotalResult"];
}
