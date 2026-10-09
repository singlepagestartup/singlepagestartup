import { Component as View } from "./index";
import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
export function Component() {
  const graph = projectThreadGraph(aiChatProjectFixture());
  return (
    <View
      variant="find"
      data={graph.threadMessages}
      apiProps={{
        params: {
          filters: {
            and: [
              { column: "threadId", method: "eq", value: graph.threads[0].id },
            ],
          },
        },
      }}
    >
      {(relations) => (
        <pre className="p-4 text-sm">{JSON.stringify(relations, null, 2)}</pre>
      )}
    </View>
  );
}
