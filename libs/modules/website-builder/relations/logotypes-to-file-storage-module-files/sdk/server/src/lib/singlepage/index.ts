import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/sdk/model";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
