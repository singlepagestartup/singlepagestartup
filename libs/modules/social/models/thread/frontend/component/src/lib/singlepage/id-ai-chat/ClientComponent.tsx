"use client";
import { ChatThreadPanel } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="social"
      data-model="thread"
      data-variant="id-ai-chat"
      data-id={props.data.id}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <ChatThreadPanel
        threadId={props.data.id}
        title={props.data.title || ""}
        language={props.language}
        isDocument={props.isDocument}
        navigation={props.navigation}
        messages={props.messages}
        composer={props.composer}
        knowledge={props.knowledge}
        documentDownload={props.documentDownload}
      />
    </div>
  );
}
