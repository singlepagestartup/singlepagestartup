import { Component as SocialModuleChat } from "../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/models/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../../knowledge/models/source/singlepage/ai-chat-document/Source";

function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <div className="@container/workspace flex h-160 flex-col overflow-hidden">
          <SocialModuleChat variant="ai-chat-products" profileId="pottery" />
        </div>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-social-models-chat-singlepage-ai-chat-products",
  title: "Modules/Social/Models/Chat/Singlepage/ai-chat-products",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
