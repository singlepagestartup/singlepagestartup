import type { ComponentProps, ComponentType } from "react";
import { Component as ListItemPendingAiChat } from "./singlepage/list/item/pending/ai-chat/index";
import { Component as ListAttachmentsAiChat } from "./singlepage/list/attachments/ai-chat/index";
import { Component as ListItemAssetAiChat } from "./singlepage/list/item/asset/ai-chat/index";
import { Component as OverviewAiChat } from "./singlepage/overview/ai-chat/index";
import { Component as AttachmentAiChat } from "./singlepage/attachment/ai-chat";
const variants = {
  "attachment-ai-chat": AttachmentAiChat,
  "list-item-pending-ai-chat": ListItemPendingAiChat,
  "list-attachments-ai-chat": ListAttachmentsAiChat,
  "list-item-asset-ai-chat": ListItemAssetAiChat,
  "overview-ai-chat": OverviewAiChat,
};
type Props = {
  [V in keyof typeof variants]: { variant: V } & ComponentProps<
    (typeof variants)[V]
  >;
}[keyof typeof variants];
export function Component(props: Props) {
  const View = variants[props.variant] as ComponentType<Props>;
  return <View {...props} />;
}
