import { Component as Thread } from "../../../index";

import { useState } from "react";
import type { IProjectTopic } from "../../../../profile/singlepage/scope/ai-chat/project/state";
import type { Meta, StoryObj } from "@storybook/react";

function Component() {
  const [topic, setTopic] = useState<IProjectTopic>({
    id: "work",
    title: "Workshop campaign",
    documentIds: [],
    messages: [],
  });
  return (
    <Thread
      variant="id-ai-chat-settings"
      topic={topic}
      onSave={(title) => setTopic({ ...topic, title })}
      onDelete={() => {}}
    />
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-id-ai-chat-settings",
  title: "Modules/Social/Thread/Singlepage/id/ai-chat-settings",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
