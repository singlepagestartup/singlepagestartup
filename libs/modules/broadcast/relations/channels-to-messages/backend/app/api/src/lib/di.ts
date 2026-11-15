import type { Service as BroadcastModuleMessage } from "@sps/broadcast/models/message/backend/app/api/src/lib/service";

export interface IMessageService {
  findPayloadById: BroadcastModuleMessage["findPayloadById"];
}

export const ChannelsToMessagesDI = {
  IMessageService: Symbol.for("broadcast.channels-to-messages.message.service"),
};
