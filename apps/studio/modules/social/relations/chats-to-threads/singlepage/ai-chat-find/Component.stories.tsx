import { Component as ChatsToThreads } from "../../index";

import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  const graph = projectThreadGraph(aiChatProjectFixture());
  return (
    <ChatsToThreads
      variant="find"
      data={graph.chatThreads}
      apiProps={{
        params: {
          filters: {
            and: [{ column: "chatId", method: "eq", value: graph.chat.id }],
          },
        },
      }}
    >
      {(relations) => (
        <pre className="p-4 text-sm">{JSON.stringify(relations, null, 2)}</pre>
      )}
    </ChatsToThreads>
  );
}

const meta = {
  id: "modules-social-relations-chats-to-threads-singlepage-ai-chat-find",
  title: "Modules/Social/Relations/Chats-To-Threads/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
