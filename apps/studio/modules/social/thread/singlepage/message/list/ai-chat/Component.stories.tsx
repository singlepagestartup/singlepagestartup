import { Component as Thread } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { FilesProvider } from "../../../../../../file-storage/file/singlepage/list-attachments-ai-chat/Files";
import { SourceProvider } from "../../../../../../knowledge/source/singlepage/id/ai-chat/Source";
import { ThreadProvider } from "../../../id/ai-chat/Thread";

function Component() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ThreadProvider>
          <Thread variant="message-list-ai-chat" />
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>
  );
}

const meta = {
  id: "modules-social-models-thread-singlepage-message-list-ai-chat",
  title: "Modules/Social/Thread/Singlepage/message/list/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
