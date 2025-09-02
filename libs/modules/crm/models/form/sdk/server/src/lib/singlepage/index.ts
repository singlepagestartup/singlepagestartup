import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/crm/models/form/sdk/model";
import {
  action as requestCreate,
  type IProps as IRequestCreateProps,
  type IResult as IRequestCreateResult,
} from "./request/create";

export type IProps = {
  IRequestCreateProps: IRequestCreateProps;
};

export type IResult = {
  IRequestCreateResult: IRequestCreateResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  requestCreate,
};
