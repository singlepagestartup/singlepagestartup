import { Component } from "./index";
import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  const graph = projectThreadGraph(aiChatProjectFixture());
  return (
    <Component
      data={graph.chat}
      threads={graph.threads}
      relations={graph.chatThreads}
      selectedThreadId={graph.threads[0].id}
    >
      {(thread) => <p className="p-4">{thread?.title}</p>}
    </Component>
  );
}

const meta = {
  id: "modules-social-models-chat-singlepage-ai-chat-workspace",
  title: "Modules/Social/Models/Chat/Singlepage/ai-chat-workspace",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
