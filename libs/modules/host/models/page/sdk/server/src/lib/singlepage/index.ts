import { factory } from "@sps/shared-frontend-server-api";
import { action as findByUrl } from "./actions/find-by-url";
import { action as urls } from "./actions/urls";
import { action as urlSegmentValue } from "./actions/url-segment-value";
import {
  IModel,
  serverHost,
  route,
  query,
} from "@sps/host/models/page/sdk/model";

export type IProps = {};

export type IResult = {};

export interface Params {
  url?: string | string[];
}

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    params: query,
  }),
  findByUrl,
  urls,
  urlSegmentValue,
};
