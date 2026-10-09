import { Component as SocialModuleThread } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-document/Source";
import { ThreadProvider } from "../ai-chat-products/Thread";
function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ThreadProvider
          data={{
            id: "pottery:thread:document:products",
            slug: "pottery:document:products",
            title: "Products.md",
            variant: "ai-chat-products",
          }}
        >
          <SocialModuleThread variant="ai-chat-conversation" />
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-ai-chat-conversation",
  title: "Modules/Social/Models/Thread/Singlepage/ai-chat-conversation",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
