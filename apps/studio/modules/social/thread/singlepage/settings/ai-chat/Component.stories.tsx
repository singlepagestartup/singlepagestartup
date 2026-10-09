import { Component as SocialModuleThread } from "../../../index";

import { useState } from "react";
import type { IProjectTopic } from "../../../../../../workspace/utils/products/ai-chat-workspace";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  const [topic, setTopic] = useState<IProjectTopic>({
    id: "work",
    title: "Workshop campaign",
    documentIds: [],
    messages: [],
  });
  return (
    <SocialModuleThread
      variant="settings-ai-chat"
      topic={topic}
      onSave={(title) => setTopic({ ...topic, title })}
      onDelete={() => {}}
    />
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-settings-ai-chat",
  title: "Modules/Social/Models/Thread/Singlepage/settings/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
