import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/host/models/metadata/sdk/model";
import { action as generate, generatePageSeo } from "./actions/generate";

export type { IGeneratePageSeoProps, IPageSeoResult } from "./actions/generate";

export type IProps = {};

export type IResult = {};

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    params: query,
    options,
  }),
  generate,
  generatePageSeo,
};
