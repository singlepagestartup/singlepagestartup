export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { type IProps, type IResult } from "@sps/rbac/models/subject/sdk/server";
import { NextRequestOptions } from "@sps/shared-utils";

export const variant = "ecommerce-module-order-list-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  data: IModel;
  language: string;
  apiProps?: {
    params?: IProps["IEcommerceModuleOrderListProps"];
    options?: Partial<NextRequestOptions>;
  };
  className?: string;
  children?: ({
    data,
  }: {
    data: IResult["IEcommerceModuleOrderListResult"];
  }) => any;
}

export interface IComponentPropsExtended extends Omit<IComponentProps, "data"> {
  data: IResult["IEcommerceModuleOrderListResult"];
}
