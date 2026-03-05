import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/ecommerce/models/product/sdk/model";
import {
  action as extended,
  type IProps as IExtendedProps,
  type IResult as IExtendedResult,
} from "./extended";

export type IProps = {
  IExtendedProps: IExtendedProps;
};

export type IResult = {
  IExtendedResult: IExtendedResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  extended,
};
