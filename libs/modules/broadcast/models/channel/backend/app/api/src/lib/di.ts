export const ChannelDI = {
  IDeliveryRepository: Symbol.for("broadcast.channel.delivery.repository"),
  IMessageService: Symbol.for("broadcast.channel.message.service"),
  IChannelsToMessagesService: Symbol.for(
    "broadcast.channel.channels-to-messages.service",
  ),
};
