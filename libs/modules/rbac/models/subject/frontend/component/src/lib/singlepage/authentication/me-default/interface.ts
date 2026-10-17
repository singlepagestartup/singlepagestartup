export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { NextRequestOptions } from "@sps/shared-utils";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { Dispatch, SetStateAction } from "react";

export const variant = "authentication-me-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  fallback?: import("react").ReactNode;
  unauthenticatedRedirectHref?: string;
  set?: Dispatch<SetStateAction<IModel | undefined>>;
  children?: ({
    data,
    authenticated,
  }: {
    data: IModel | undefined;
    authenticated: boolean;
  }) => any;
  apiProps?: {
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
  };
}

export interface IComponentPropsExtended extends IComponentProps {}
