import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/ecommerce/models/product/sdk/model";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
  params: query,
});
