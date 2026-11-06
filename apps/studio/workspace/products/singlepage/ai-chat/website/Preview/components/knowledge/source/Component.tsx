import type { ComponentProps, ComponentType } from "react";
import { Component as DownloadAiChat } from "./singlepage/download/ai-chat/index";
import { Component as ListItemDocumentAiChat } from "./singlepage/list/item/document/ai-chat/index";
import { Component as OverviewDocumentAiChat } from "./singlepage/overview/document/ai-chat/index";
const variants = {
  "download-ai-chat": DownloadAiChat,
  "list-item-document-ai-chat": ListItemDocumentAiChat,
  "overview-document-ai-chat": OverviewDocumentAiChat,
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
