import { Component as Message, type IMessageListProps } from "../../index";

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { knowledgeAgent } from "../../../profile/singlepage/agent/id/ai-chat/index";

import { aiChatAttachmentFixture } from "../../../profile/singlepage/scope/ai-chat/project/fixtures";

function Component(props: IMessageListProps) {
  return <Message {...props} variant="list-ai-chat" />;
}

const meta = {
  id: "modules-social-models-message-singlepage-list-ai-chat",
  title: "Modules/Social/Message/Singlepage/list-ai-chat",
  component: Component,
  args: {
    threadId: "pottery:thread:document:products",
    messages: [
      {
        id: "products-intro",
        role: "assistant",
        agent: knowledgeAgent,
        text: "Products.md is ready to work on. Discuss this knowledge or request a change.",
      },
    ],
  },
  argTypes: {
    threadId: { control: "text" },
    messages: { control: "object" },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};

const attachments = aiChatAttachmentFixture(4);
export const WithAttachments: StoryObj<typeof meta> = {
  args: {
    messages: [
      {
        id: "user-files",
        role: "user",
        text: "Review these references.",
        files: attachments,
      },
      {
        id: "proposal-files",
        role: "assistant",
        agent: knowledgeAgent,
        text: "The proposed document uses these four references. Confirm the changes in your next message to save them.",
        files: attachments,
      },
    ],
  },
};
export const AttachmentsOnly: StoryObj<typeof meta> = {
  args: {
    messages: [
      { id: "files-only", role: "user", text: "", files: attachments },
    ],
  },
};

export const DocumentProposal: StoryObj<typeof meta> = {
  args: {
    messages: [
      {
        id: "proposal-request",
        role: "user",
        text: "Update Products.md using these references.",
        files: attachments,
      },
      {
        id: "pending-document",
        role: "assistant",
        agent: knowledgeAgent,
        text: "Proposed Products.md\n\nWeekend pottery workshops for adults trying pottery for the first time. Six places per class. Materials are included.\n\nThis draft is not saved yet. Confirm the changes in your next message to save the document and attach these files.",
        files: attachments,
      },
    ],
  },
};
export const ConfirmedDocument: StoryObj<typeof meta> = {
  args: {
    messages: [
      ...DocumentProposal.args!.messages!,
      {
        id: "confirm-document",
        role: "user",
        text: "I confirm. Save this draft.",
      },
      {
        id: "document-saved",
        role: "assistant",
        agent: knowledgeAgent,
        text: "Products.md is saved. The four files are attached to the document.",
      },
    ],
  },
};

export const RealtimeHistory: StoryObj<typeof meta> = {
  render: function RealtimeHistory(args) {
    const [messages, setMessages] = useState(
      Array.from({ length: 30 }, (_, index) => ({
        id: `history-${index}`,
        role: "user" as const,
        text: `Message ${index + 1}`,
      })),
    );
    return (
      <div className="mx-auto max-w-xl">
        <button
          onClick={() =>
            setMessages((current) => [
              ...current,
              {
                id: `message-${current.length}`,
                role: "user",
                text: "New incoming message",
              },
            ])
          }
          className="rounded border p-3"
        >
          Append message
        </button>
        <div data-ai-chat-messages className="h-96 overflow-y-auto">
          <Component {...args} messages={messages} />
        </div>
      </div>
    );
  },
};
