import { Component as View } from "./index";
import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
export function Component() {
  const graph = projectThreadGraph(aiChatProjectFixture());
  return (
    <View
      data={graph.chat}
      threads={graph.threads}
      relations={graph.chatThreads}
      selectedThreadId={graph.threads[0].id}
    >
      {(thread) => <p className="p-4">{thread?.title}</p>}
    </View>
  );
}
