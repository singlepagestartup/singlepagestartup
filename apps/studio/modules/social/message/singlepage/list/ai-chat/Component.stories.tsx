import { Component as SocialModuleMessage } from "../../../index";

import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { SourceProvider } from "../../../../../knowledge/source/singlepage/overview/document/ai-chat/Source";
import { ThreadProvider } from "../../../../thread/singlepage/overview/ai-chat/Thread";
function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ThreadProvider
          data={{
            id: "pottery:thread:document:products",
            slug: "pottery:document:products",
            title: "Products.md",
            variant: "overview-ai-chat",
          }}
        >
          <SocialModuleMessage variant="list-ai-chat" />
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-social-models-message-singlepage-list-ai-chat",
  title: "Modules/Social/Models/Message/Singlepage/list/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
