import { Component as View } from "./index";
import { documentAgent } from "../../../../../../workspace/utils/products/ai-chat-agent-resolver";
export function Component() {
  return (
    <View
      message={{
        id: "brief-intro",
        role: "assistant",
        text: "Who is the workshop for?",
      }}
      agent={documentAgent("brief")}
      showContext
      onSelect={() => {}}
    />
  );
}
