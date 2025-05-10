export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { ReactNode } from "react";
import { type IProps, type IResult } from "@sps/rbac/models/subject/sdk/server";
import { NextRequestOptions } from "@sps/shared-utils";

export const variant = "ecommerce-module-order-total-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: IModel;
  language: string;
  apiProps?: {
    params?: IProps["IEcommerceModuleOrderTotalProps"];
    options?: Partial<NextRequestOptions>;
  };
  children?: ReactNode;
  className?: string;
}

export interface IComponentPropsExtended extends Omit<IComponentProps, "data"> {
  data: IResult["IEcommerceModuleOrderTotalResult"];
}
