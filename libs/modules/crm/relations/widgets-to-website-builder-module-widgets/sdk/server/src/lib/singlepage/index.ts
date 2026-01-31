import { factory } from "@sps/shared-frontend-server-api";
import {
  route,
  IModel,
  serverHost,
  options,
} from "@sps/crm/relations/widgets-to-website-builder-module-widgets/sdk/model";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  route,
  host: serverHost,
  options,
});
