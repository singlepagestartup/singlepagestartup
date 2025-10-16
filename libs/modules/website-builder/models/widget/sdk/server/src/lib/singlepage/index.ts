import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  serverHost,
  IModel,
  query,
  options,
} from "@sps/website-builder/models/widget/sdk/model";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
  params: query,
});
