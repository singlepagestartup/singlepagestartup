import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import {
  action as total,
  type IProps as ITotalProps,
  type IResult as ITotalResult,
} from "./total";

export type IProps = {
  ITotalProps: ITotalProps;
};

export type IResult = {
  ITotalResult: ITotalResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
  }),
  total,
};
