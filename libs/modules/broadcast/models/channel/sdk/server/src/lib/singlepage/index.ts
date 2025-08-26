import { factory } from "@sps/shared-frontend-server-api";
import {
  serverHost,
  route,
  IModel,
  query,
  options,
} from "@sps/broadcast/models/channel/sdk/model";
import { action as pushMessage } from "./push-message";
import { action as messageFind } from "./message-find";
import { action as messageCreate } from "./message-create";
import { action as messageDelete } from "./message-delete";

export const api = {
  ...factory<IModel>({
    route,
    host: serverHost,
    options,
    params: query,
  }),
  pushMessage,
  messageFind,
  messageCreate,
  messageDelete,
};
