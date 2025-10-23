import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/rbac/models/identity/sdk/model";
import {
  action as changePassword,
  type IProps as IChangePasswordProps,
  type IResult as IChangePasswordResult,
} from "./actions/change-password";

import {
  action as emailAndPassword,
  type IProps as IEmailAndPasswordProps,
  type IResult as IEmailAndPasswordResult,
} from "./actions/email-and-password";

export type IProps = {
  IChangePasswordProps: IChangePasswordProps;
  IEmailAndPasswordProps: IEmailAndPasswordProps;
};

export type IResult = {
  IChangePasswordResult: IChangePasswordResult;
  IEmailAndPasswordResult: IEmailAndPasswordResult;
};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  emailAndPassword,
  changePassword,
};
