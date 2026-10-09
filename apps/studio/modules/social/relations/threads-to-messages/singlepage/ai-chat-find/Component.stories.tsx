import { Component } from "./index";
import { projectThreadGraph } from "../../../../../../workspace/utils/products/ai-chat-threads";
import { aiChatProjectFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
import type { Meta, StoryObj } from "@storybook/react";

function Example() {
  const graph = projectThreadGraph(aiChatProjectFixture());
  return (
    <Component
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
    </Component>
  );
}

const meta = {
  id: "modules-social-relations-threads-to-messages-singlepage-ai-chat-find",
  title: "Modules/Social/Relations/Threads-To-Messages/Singlepage/ai-chat-find",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
