export const ChannelDI = {
  IMessageService: Symbol.for("broadcast.channel.message.service"),
  IChannelsToMessagesService: Symbol.for(
    "broadcast.channel.channels-to-messages.service",
  ),
};
