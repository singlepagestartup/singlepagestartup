import {
  action as content,
  type IProps as IContentProps,
  type IResult as IContentResult,
} from "./content";
import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/file-storage/models/file/sdk/model";

import {
  action as createFromUrl,
  type IProps as ICreateFromUrlProps,
  type IResult as ICreateFromUrlResult,
} from "./actions/create-from-url";

import {
  action as generate,
  type IProps as IGenerateProps,
  type IResult as IGenerateResult,
} from "./actions/generate";

export type IProps = {
  IContentProps: IContentProps;
  IGenerateProps: IGenerateProps;
  ICreateFromUrlProps: ICreateFromUrlProps;
};

export type IResult = {
  IContentResult: IContentResult;
  IGenerateResult: IGenerateResult;
  ICreateFromUrlResult: ICreateFromUrlResult;
};

export const api = {
  content,
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  createFromUrl,
  generate,
};
