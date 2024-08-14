import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/notification/models/widget/sdk/model";

export const api = factory<IModel>({
  route,
  host,
  options,
  params: query,
});