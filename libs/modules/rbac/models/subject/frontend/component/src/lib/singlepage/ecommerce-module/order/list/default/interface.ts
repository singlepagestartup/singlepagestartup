export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { type IProps, type IResult } from "@sps/rbac/models/subject/sdk/server";
import type { ReactNode } from "react";

export const variant = "ecommerce-module-order-list-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: IModel;
  language: string;
  apiProps?: {
    params?: IProps["IEcommerceModuleOrderListProps"]["params"];
    options?: IProps["IEcommerceModuleOrderListProps"]["options"];
  };
  className?: string;
  children?: ({
    data,
  }: {
    data: IResult["IEcommerceModuleOrderListResult"];
  }) => ReactNode;
}

export interface IComponentPropsExtended extends Omit<IComponentProps, "data"> {
  data: IResult["IEcommerceModuleOrderListResult"];
}
