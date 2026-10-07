import { Component as View } from "@sps/social/relations/chats-to-threads/frontend/component/src/lib/singlepage/ai-chat-workspace";
import { useState } from "react";
import { aiChatProjectFixture } from "./../../../../../../../../tools/studio/products/fixtures/ai-chat-workspace";
export function Component() {
  const [project, setProject] = useState(aiChatProjectFixture);
  return (
    <View
      project={project}
      active
      onUpdate={(_, update) => setProject(update)}
    />
  );
}
