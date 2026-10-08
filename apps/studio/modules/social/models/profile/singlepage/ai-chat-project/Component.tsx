import { Component as View } from "./index";
import { useState } from "react";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
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
