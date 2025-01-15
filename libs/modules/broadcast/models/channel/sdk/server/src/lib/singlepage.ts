import { factory } from "@sps/shared-frontend-server-api";
import {
  host,
  route,
  IModel,
  query,
  options,
} from "@sps/broadcast/models/channel/sdk/model";
import { action as pushMessage } from "./actions/push-message";
import { action as messageFind } from "./actions/message-find";
import { action as messageCreate } from "./actions/message-create";
import { action as messageDelete } from "./actions/message-delete";

export const api = {
  ...factory<IModel>({
    route,
    host,
    options,
    params: query,
  }),
  pushMessage,
  messageFind,
  messageCreate,
  messageDelete,
};
