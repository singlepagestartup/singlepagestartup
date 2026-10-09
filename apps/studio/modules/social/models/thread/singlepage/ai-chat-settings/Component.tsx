import { Component as View } from "./index";
import { useState } from "react";
import type { IProjectTopic } from "../../../../../../workspace/utils/products/ai-chat-workspace";
export function Component() {
  const [topic, setTopic] = useState<IProjectTopic>({
    id: "work",
    title: "Workshop campaign",
    documentIds: [],
    messages: [],
  });
  return (
    <View
      topic={topic}
      onSave={(title) => setTopic({ ...topic, title })}
      onDelete={() => {}}
    />
  );
}
